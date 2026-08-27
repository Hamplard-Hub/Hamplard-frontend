# File Upload Component with Progress Bar

Closes #156

## Summary

This PR enhances the existing FileUpload component with comprehensive features for course creation. The component now supports drag-and-drop file uploads, real-time progress tracking, video duration detection, and robust error handling. Perfect for instructors uploading course thumbnails and lecture videos.

## Changes

### Modified Files
- **`src/components/ui/FileUpload.tsx`** - Enhanced with:
  - Drag-and-drop support with visual feedback
  - Real-time upload progress tracking (0-100%)
  - Cancel button to stop mid-upload
  - File type and size validation
  - Video duration detection and display
  - Improved error states with retry logic
  - Success state with checkmark
  - Enhanced accessibility with ARIA labels

- **`src/components/ui/FileUpload.test.tsx`** - New comprehensive test suite (50+ tests)

## Feature Details

### Core Upload Features
- ✅ **Drag-and-drop zone** with visual feedback (border/background color changes)
- ✅ **Browse files button** - Click to open native file picker
- ✅ **Multiple file uploads** - Upload one or many files (configurable)
- ✅ **Single file mode** - Replace previous upload when `multiple=false`

### Progress Tracking
- ✅ **Real-time progress bar** - Shows 0-100% during upload
- ✅ **Progress percentage** - Numeric display (e.g., "45%")
- ✅ **Animated progress bar** - Smooth transitions with gradient color
- ✅ **onProgress callback** - Custom progress tracking for parent components

### File Management
- ✅ **File validation**:
  - Accept filter by MIME type or extension (e.g., `image/*`, `.mp4`)
  - Max file size validation (default 100MB, configurable)
  - Clear error messages for failed validation
  
- ✅ **File metadata**:
  - Display file name (with truncation on overflow)
  - Display file size in human-readable format (B, KB, MB, GB)
  - Display video duration in MM:SS format
  - Show image thumbnails for preview
  - Show video icon for video files

### Upload Control
- ✅ **Cancel button** - Stops upload mid-way (removes file from list)
- ✅ **Retry button** - Resends upload on network error (not on validation errors)
- ✅ **Remove button** - Cleans up completed or error uploads

### Success & Error States
- ✅ **Success state**:
  - Checkmark icon appears
  - File stays in list (user can verify)
  - `onUploadComplete` callback fires with file metadata
  
- ✅ **Error state**:
  - Red error icon and message
  - Network errors show retry button
  - Validation errors show clear reasons (type, size)
  - No retry for validation errors (would fail again)

### Video Support
- ✅ **Video duration detection** - Extracts duration from video files
- ✅ **Duration display** - Shows in MM:SS format next to file size
- ✅ **Metadata in callback** - Returns duration in `onUploadComplete` result

### API Integration
- ✅ **XMLHttpRequest-based** - Handles progress tracking at byte level
- ✅ **Bearer token auth** - Attaches JWT from localStorage
- ✅ **Multipart form data** - Proper content-type and file field handling
- ✅ **Extra fields support** - Send additional form fields (e.g., upload type)

## Usage Examples

### Basic Image Upload (Thumbnail)
```tsx
<FileUpload
  uploadUrl="/api/v1/uploads/thumbnail"
  accept={['image/jpeg', 'image/png', 'image/webp']}
  maxSizeBytes={5 * 1024 * 1024} // 5MB
  multiple={false}
  label="Upload course thumbnail"
  hint="JPG, PNG, WebP up to 5MB"
  onUploadComplete={(file) => console.log('Uploaded:', file)}
  onUploadError={(name, error) => console.error(name, error)}
/>
```

### Video Upload (Lecture)
```tsx
<FileUpload
  uploadUrl="/api/v1/uploads/video"
  accept={['video/mp4', 'video/quicktime']}
  maxSizeBytes={2 * 1024 * 1024 * 1024} // 2GB
  multiple={false}
  label="Upload lecture video"
  hint="MP4, MOV up to 2GB"
  onUploadComplete={(file) => {
    console.log(`Video: ${file.fileName} (${file.duration}s)`);
  }}
  onProgress={(progress) => console.log(`${progress}%`)}
/>
```

### Multi-File Upload
```tsx
<FileUpload
  uploadUrl="/api/v1/uploads/resource"
  accept={['application/pdf', '.doc', '.docx']}
  maxSizeBytes={50 * 1024 * 1024} // 50MB
  multiple={true}
  label="Upload course materials"
  onUploadComplete={(file) => handleFileUpload(file)}
/>
```

## Technical Specifications

### File Size Limits (Recommended)
- Thumbnail: 5MB max
- Video: 2GB max (per requirement)
- Documents: 50MB max
- Default: 100MB

### Accepted File Types (In Course Context)
- **Thumbnails**: `image/jpeg`, `image/png`, `image/webp`
- **Videos**: `video/mp4`, `video/quicktime` (MP4, MOV)
- **Resources**: `application/pdf`, `.doc`, `.docx`

### Progress Tracking
- Updates on every XMLHttpRequest `upload.onprogress` event
- Accurate byte tracking: `(loaded / total) * 100`
- Callback on each progress tick for custom UI

### Error Handling
- Network errors: Show "Network error — please try again" with retry
- Timeout: Handled by XMLHttpRequest timeout property
- Validation errors: Show specific reason (type, size)
- Upload failure (4xx/5xx): Show HTTP status in error message

## Acceptance Criteria

- ✅ Drag-and-drop zone working (visual feedback on hover/active)
- ✅ Browse files button opens file picker
- ✅ Progress bar updates 0-100% during upload
- ✅ Cancel button stops upload mid-way
- ✅ File type validation prevents bad uploads
- ✅ File size validation prevents oversized uploads
- ✅ Success state shows checkmark and triggers callback
- ✅ Error state shows retry button for network errors
- ✅ Video duration detected and displayed
- ✅ Comprehensive test coverage (50+ tests)

## Testing

Comprehensive test suite covering:
- ✅ Drag-and-drop: hover, leave, drop
- ✅ File picker: click, Enter key, Space key
- ✅ File validation: MIME type, size limits
- ✅ Upload progress: bar, percentage, callback
- ✅ Cancel/Remove: stops upload, removes file
- ✅ Success: checkmark, callback, metadata
- ✅ Error: message, retry, validation errors
- ✅ Metadata: file size, video duration
- ✅ Multiple vs single file mode
- ✅ Accessibility: ARIA attributes

## Browser Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Drag-and-drop API
- ✅ XMLHttpRequest with upload progress
- ✅ Blob/File API
- ✅ HTML5 Video metadata

## Accessibility

- ✅ Drop zone has `role="button"` for keyboard users
- ✅ Progress bar has `role="progressbar"` with ARIA attributes
- ✅ File input is `sr-only` (screen reader only)
- ✅ Buttons have proper `aria-label` attributes
- ✅ Icons have `aria-hidden="true"` to avoid duplicate announcements
- ✅ Error messages associated with error icons
- ✅ All interactive elements keyboard accessible

## Performance

- Efficient progress tracking with XMLHttpRequest
- Minimal re-renders using React hooks
- Image previews created with `URL.createObjectURL` (not base64)
- Proper cleanup of blob URLs to prevent memory leaks
- Video duration detection doesn't block UI

## Security

- File validation on client-side (plus server-side required)
- MIME type checking before upload
- Size limits prevent resource abuse
- Bearer token sent with Authorization header
- No sensitive data in form fields

## Integration with Course Creation

The enhanced FileUpload component integrates seamlessly with the existing course creation page. Future updates to `src/app/dashboard/courses/create/page.tsx` can use this component for:
- Thumbnail upload with 5MB limit, image type validation
- Lecture video upload with 2GB limit, video type validation
- Progress tracking and error handling

## Future Enhancements

1. **Pause/Resume**: Add pause/resume functionality for large uploads
2. **Batch uploads**: Multiple simultaneous uploads with queue
3. **Upload history**: Track and display previously uploaded files
4. **Resumable uploads**: Implement TUS protocol for resilient uploads
5. **Compression**: Client-side image/video compression before upload
6. **S3 integration**: Direct-to-S3 uploads with presigned URLs

## Notes

- Token is read from `localStorage.hamplard_token` at upload time
- Requires CORS-enabled upload endpoint
- Progress tracking is accurate at byte level
- Video duration detection works with standard HTML5 video formats
- Memory is properly cleaned up (blob URLs revoked, XHR aborted)

## Related Issue

This PR directly addresses #156 requirements for the course creation flow, enabling instructors to upload course materials with clear visual feedback and robust error handling.
