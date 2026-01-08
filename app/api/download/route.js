
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let fileUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'download.pdf';

    if (!fileUrl) {
        return NextResponse.json({ error: 'Missing file URL' }, { status: 400 });
    }

    try {
        fileUrl = fileUrl.trim();
        filename = filename.trim().replace(/[/\\?%*:|"<>]/g, '-');

        // Validate URL format
        let isValidUrl = false;
        try {
            new URL(fileUrl);
            isValidUrl = true;
        } catch (urlError) {
            console.error('Invalid URL format:', fileUrl);
            return NextResponse.json({ 
                error: 'Invalid file URL format',
                details: urlError.message 
            }, { status: 400 });
        }

        if (!isValidUrl) {
            return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
        }

        let publicId = '';
        let resourceType = 'image';

        // Extract Cloudinary public ID if it's a Cloudinary URL
        if (fileUrl.includes('cloudinary.com')) {
            try {
                const urlObj = new URL(fileUrl);
                const urlParts = urlObj.pathname.split('/');
                const uploadIndex = urlParts.indexOf('upload');
                
                if (uploadIndex !== -1 && uploadIndex > 0) {
                    resourceType = urlParts[uploadIndex - 1] || 'image';
                    let startIndex = uploadIndex + 1;
                    
                    // Skip version number if present (e.g., v1234567890)
                    if (urlParts[startIndex] && urlParts[startIndex].startsWith('v') && /^v\d+$/.test(urlParts[startIndex])) {
                        startIndex++;
                    }
                    
                    const pathParts = urlParts.slice(startIndex);
                    const fullPath = pathParts.join('/');

                    if (resourceType === 'raw') {
                        publicId = fullPath;
                    } else {
                        // Remove file extension for non-raw resources
                        const lastDotIndex = fullPath.lastIndexOf('.');
                        publicId = lastDotIndex !== -1 ? fullPath.substring(0, lastDotIndex) : fullPath;
                    }
                }
            } catch (parseError) {
                console.warn('Failed to parse Cloudinary URL:', parseError.message);
                // Continue with direct redirect if parsing fails
            }
        }

        // If we have a Cloudinary public ID, generate signed URL
        if (publicId) {
            console.log(`[Proxy] Processing Cloudinary resource: ${publicId} (${resourceType})`);

            try {
                // Generate Signed Deliverable Link
                // Using signed URLs ensures secure delivery even if the asset has access restrictions
                const signedUrl = cloudinary.url(publicId, {
                    resource_type: resourceType,
                    sign_url: true,
                    secure: true,
                    flags: 'attachment',
                    attachment: filename,
                });

                console.log(`[Proxy] Redirecting to signed CDN URL`);
                return NextResponse.redirect(signedUrl);
            } catch (cloudinaryError) {
                console.error('Cloudinary processing error:', cloudinaryError);
                // Fallback to direct URL if Cloudinary processing fails
                console.log(`[Proxy] Falling back to direct URL`);
                return NextResponse.redirect(fileUrl);
            }
        }

        // For non-Cloudinary URLs, redirect directly
        return NextResponse.redirect(fileUrl);

    } catch (error) {
        console.error('Download Proxy Error:', error);
        return NextResponse.json({ 
            error: 'Download failed',
            message: error.message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
