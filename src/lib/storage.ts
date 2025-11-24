import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

/**
 * Sanitizes a file name to be compatible with Supabase Storage
 * Removes/replaces special characters that are not allowed in storage paths
 * 
 * @param fileName - The original file name
 * @returns Sanitized file name safe for storage
 */
function sanitizeFileName(fileName: string): string {
  // Separate name and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  
  // Replace special characters with underscores
  // Keep only: letters, numbers, hyphens, underscores, periods
  const sanitizedName = name
    .replace(/[^\w\s.-]/g, '_')  // Replace special characters
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/_+/g, '_')          // Reduce multiple underscores to one
    .replace(/^_+|_+$/g, '');     // Remove leading/trailing underscores
  
  return sanitizedName + extension;
}

/**
 * Uploads an input file to the storage bucket following the pattern:
 * {opportunityId}/inputs/{filename}
 * 
 * @param file - The file to upload
 * @param opportunityId - The opportunity ID this file belongs to
 * @returns Upload result with storage path or error
 */
export async function uploadInputFile(
  file: File,
  opportunityId: number
): Promise<UploadResult> {
  try {
    // Validate file type
    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "Only PDF files are allowed",
      };
    }

    // Sanitize the file name and construct the storage path
    const sanitizedFileName = sanitizeFileName(file.name);
    const storagePath = `${opportunityId}/inputs/${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("inputs-files")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false, // Prevent overwriting existing files
      });

    if (uploadError) {
      // Handle duplicate file error
      if (uploadError.message.includes("already exists")) {
        return {
          success: false,
          error: "A file with this name already exists. Please rename the file or delete the existing one.",
        };
      }
      return {
        success: false,
        error: uploadError.message,
      };
    }

    return {
      success: true,
      storagePath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred during upload",
    };
  }
}

/**
 * Gets a signed URL for downloading a file
 * 
 * @param storagePath - The storage path of the file
 * @param expiresIn - Expiration time in seconds (default: 60)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 60
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("inputs-files")
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
}

/**
 * Deletes a file from storage
 * 
 * @param storagePath - The storage path of the file to delete
 * @returns Success status
 */
export async function deleteInputFile(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from("inputs-files")
      .remove([storagePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}
