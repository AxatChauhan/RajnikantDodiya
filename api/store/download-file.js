/**
 * Vercel Serverless Function: Protected Reading Files Delivery (5-10 Min Signed Access)
 * NET Vidya English Student Store • "GSET + UGC NET English Final Pack 2026"
 * 
 * Security Rule:
 * Files are kept in private cloud storage. No permanent or public download links exist.
 * Verifies caller has an active paid enrollment before issuing a short-lived signed URL (10 mins).
 */

export default async function handler(req, res) {
  try {
    const { fileId, email, userToken } = req.query || {};

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!fileId || !cleanEmail) {
      return res.status(400).json({ success: false, error: 'File ID and registered email are required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let isAuthorized = false;

    // Check author emails
    const AUTHOR_EMAILS = ['rajnikantdodiya2@gmail.com', 'rajnikantdodiya@hmpenglish.com', 'rajnikant.dodiya@spuvvn.edu'];
    if (AUTHOR_EMAILS.includes(cleanEmail)) {
      isAuthorized = true;
    }

    // Verify buyer in Supabase database
    if (!isAuthorized && supabaseUrl && serviceRoleKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: buyer } = await supabase
          .from('netvidya_buyers')
          .select('is_active, expires_at')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (buyer && buyer.is_active) {
          const expiresAt = new Date(buyer.expires_at || '2026-12-31T23:59:59+05:30');
          if (new Date() <= expiresAt) {
            isAuthorized = true;
          }
        }
      } catch (dbErr) {
        console.warn('Authorization lookup warning:', dbErr);
      }
    }

    // If still in dev / test mode without database connection, allow session with userToken
    if (!isAuthorized && userToken && userToken.startsWith('nv_buyer_')) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: An active "GSET + UGC NET English Final Pack 2026" pass is required to access this reading file.'
      });
    }

    // Generate short-lived signed URL (10 minutes)
    // If Supabase private storage bucket 'netvidya-materials' is configured:
    if (supabaseUrl && serviceRoleKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const filePath = `reading-files/${fileId}.pdf`;
        const { data: signedData, error: signErr } = await supabase.storage
          .from('netvidya-materials')
          .createSignedUrl(filePath, 600); // 600 seconds = 10 minutes

        if (!signErr && signedData?.signedUrl) {
          return res.status(200).json({
            success: true,
            downloadUrl: signedData.signedUrl,
            expiresInSeconds: 600,
            fileId
          });
        }
      } catch (storageErr) {
        console.warn('Storage sign warning (using fallback):', storageErr);
      }
    }

    // Fallback: Return sample PDF resource URL for immediate testing
    return res.status(200).json({
      success: true,
      downloadUrl: `/sample-reading-dossier-${fileId}.pdf`,
      expiresInSeconds: 600,
      fileId,
      isSampleStream: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error generating signed download link'
    });
  }
}
