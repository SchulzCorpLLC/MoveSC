import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// This function is now designed to be triggered directly from the client-side
// after a user successfully signs up. It expects the user object in the request body.
serve(async (req) => {
  try {
    // Parse the request body, which now directly contains the user object
    const user = await req.json();

    if (!user || !user.id || !user.email) {
      return new Response(JSON.stringify({ error: 'Invalid user data provided in request body' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get environment variables with explicit checks
    const projectUrl = Deno.env.get('PROJECT_URL');
    const serviceKey = Deno.env.get('SERVICE_KEY');

    if (!projectUrl || !serviceKey) {
      throw new Error('Missing required environment variables PROJECT_URL or SERVICE_KEY.');
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

    if (inviteError && inviteError.code !== 'PGRST116' && inviteError.status !== 406) { // PGRST116/406 means no rows found
      console.error('Error fetching invite:', inviteError);
      throw new Error('Failed to check invites table.');
    }

    if (invite) {
      assignedRole = invite.role;
      assignedCompanyId = invite.company_id;

      // Optionally: Delete the invite record after it's been used
      const { error: deleteInviteError } = await supabaseAdmin
        .from('invites')
        .delete()
        .eq('email', userEmail);

      if (deleteInviteError) {
        console.error('Error deleting invite:', deleteInviteError);
        // Continue even if deletion fails
      }
    } else {
      // If no invite found, default to 'client' role without company_id
      console.log(`No invite found for ${userEmail}. Assigning default 'client' role.`);
    }

    // 2. Insert user into the appropriate role-specific table
    const commonUserData = {
      user_id: user.id,
      email: userEmail,
      name: user.user_metadata?.display_name || userEmail, // Use display_name from auth metadata or fallback
      phone: user.user_metadata?.phone || null, // Use phone from auth metadata or null
      company_id: assignedCompanyId,
    };

    if (assignedRole === 'client') {
      const { error } = await supabaseAdmin.from('clients').insert(commonUserData);
      if (error) {
        console.error(`Error inserting into clients table:`, error);
        throw new Error('Failed to create client record in database.');
      }
    } else if (assignedRole === 'admin') {
      if (!assignedCompanyId) {
        throw new Error(`Admin user ${userEmail} must have an associated company_id.`);
      }
      const { error } = await supabaseAdmin.from('admins').insert({
        user_id: commonUserData.user_id,
        email: commonUserData.email,
        name: commonUserData.name,
        company_id: assignedCompanyId,
      });
      if (error) {
        console.error(`Error inserting into admins table:`, error);
        throw new Error('Failed to create admin record in database.');
      }
    } else if (assignedRole === 'crew') {
      if (!assignedCompanyId) {
        throw new Error(`Crew user ${userEmail} must have an associated company_id.`);
      }
      const { error } = await supabaseAdmin.from('crew').insert(commonUserData);
      if (error) {
        console.error(`Error inserting into crew table:`, error);
        throw new Error('Failed to create crew record in database.');
      }
    }

    // 3. Update the user's app_metadata in Supabase Auth
    // This metadata will be included in the user's JWT for RLS and frontend routing.
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata, // Preserve existing app_metadata
          role: assignedRole,
          company_id: assignedCompanyId,
        },
      }
    );

    if (updateAuthError) {
      console.error('Error updating user app_metadata:', updateAuthError);
      throw new Error('Failed to set user metadata in Supabase Auth.');
    }

    console.log(`Successfully onboarded user ${userEmail} as ${assignedRole} for company ${assignedCompanyId || 'N/A'}.`);

    return new Response(JSON.stringify({ success: true, role: assignedRole, company_id: assignedCompanyId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Edge Function execution error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
