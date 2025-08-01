import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  try {
    // CORS handling for OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Ensure it's a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Parse the request body
    const user = await req.json();

    if (!user || !user.id || !user.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid user data provided in request body' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          status: 400,
        }
      );
    }

    // Get environment variables with explicit checks
    const projectUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!projectUrl || !serviceKey) {
      throw new Error('Missing required Supabase environment variables.');
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(projectUrl, serviceKey);

    const userEmail = user.email;
    let assignedRole: 'client' | 'admin' | 'crew' = 'client'; // Default role
    let assignedCompanyId: string | null = null;

    // 1. Check the 'invites' table for a matching email
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invites')
      .select('role, company_id')
      .eq('email', userEmail)
      .single();

    // Improved error handling for "no rows found"
    if (
      inviteError &&
      !(
        inviteError.code?.startsWith('PGRST') ||
        inviteError.status === 404 ||
        inviteError.status === 406
      )
    ) {
      console.error('Error fetching invite:', inviteError);
      throw new Error('Failed to check invites table.');
    }

    if (invite) {
      assignedRole = invite.role;
      assignedCompanyId = invite.company_id;

      // Delete the invite record after it's been used
      const { error: deleteInviteError } = await supabaseAdmin
        .from('invites')
        .delete()
        .eq('email', userEmail);

      if (deleteInviteError) {
        console.error('Error deleting invite:', deleteInviteError);
      }
    } else {
      // No invite found: log it for debugging if needed
      console.log(`No invite found for email: ${userEmail}, assigning default 'client' role.`);
    }

    // 2. Insert user into the appropriate role-specific table
    const commonUserData = {
      user_id: user.id,
      email: userEmail,
      name: user.user_metadata?.display_name || userEmail,
      phone: user.user_metadata?.phone || null,
      company_id: assignedCompanyId,
    };

    switch (assignedRole) {
      case 'client':
        await insertUserInTable(supabaseAdmin, 'clients', commonUserData);
        break;
      case 'admin':
        if (!assignedCompanyId) {
          throw new Error(`Admin user ${userEmail} must have an associated company_id.`);
        }
        await insertUserInTable(supabaseAdmin, 'admins', {
          ...commonUserData,
          company_id: assignedCompanyId,
        });
        break;
      case 'crew':
        if (!assignedCompanyId) {
          throw new Error(`Crew user ${userEmail} must have an associated company_id.`);
        }
        await insertUserInTable(supabaseAdmin, 'crew', commonUserData);
        break;
    }

    // 3. Update the user's app_metadata in Supabase Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          role: assignedRole,
          company_id: assignedCompanyId,
        },
      }
    );

    if (updateAuthError) {
      console.error('Error updating user app_metadata:', updateAuthError);
      throw new Error('Failed to set user metadata in Supabase Auth.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        role: assignedRole,
        company_id: assignedCompanyId,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Edge Function execution error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    );
  }
});

// Helper function to insert user into a specific table
async function insertUserInTable(
  supabaseAdmin: any,
  tableName: string,
  userData: any
) {
  const { error } = await supabaseAdmin.from(tableName).insert(userData);
  if (error) {
    console.error(`Error inserting into ${tableName} table:`, error);
    throw new Error(`Failed to create ${tableName} record in database.`);
  }
}
