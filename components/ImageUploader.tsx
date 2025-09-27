import React, { useCallback, useState, useRef } from 'react';
import { UploadIcon } from './Icons';

// Định nghĩa kiểu cho các props của component.
interface ImageUploaderProps {
  onImageUpload: (file: File) => void; // Một hàm callback sẽ được gọi khi người dùng tải ảnh lên.
}

/**
 * Thành phần giao diện cho phép người dùng tải ảnh lên
 * bằng cách kéo-thả hoặc chọn tệp từ máy tính.
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  // Trạng thái để theo dõi xem người dùng có đang kéo file vào khu vực hay không.
  const [isDragging, setIsDragging] = useState(false);
  // Ref để truy cập đến thẻ input[type=file] ẩn.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý các sự kiện kéo file (drag).
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Ngăn hành vi mặc định của trình duyệt.
    e.stopPropagation(); // Ngăn sự kiện nổi bọt (bubbling).
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true); // Khi file được kéo vào, bật trạng thái isDragging.
    } else if (e.type === 'dragleave') {
      setIsDragging(false); // Khi file được kéo ra, tắt trạng thái isDragging.
    }
  }, []);

  // Xử lý sự kiện thả file (drop).
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    // Kiểm tra xem có file được thả và có phải là file ảnh không.
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file); // Gọi callback để truyền file về cho component cha.
      }
    }
  }, [onImageUpload]);

  // Xử lý khi người dùng chọn file thông qua hộp thoại.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file); // Gọi callback.
      }
    }
  };

  // Xử lý khi người dùng nhấp vào khu vực tải lên.
  const handleClick = () => {
    fileInputRef.current?.click(); // Kích hoạt sự kiện click của thẻ input ẩn.
  };

  // Cấu trúc JSX của component.
  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      // Thay đổi style dựa trên trạng thái isDragging để cung cấp phản hồi trực quan.
      className={`w-full h-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*" // Chỉ chấp nhận các file ảnh.
        onChange={handleChange}
        className="hidden" // Ẩn thẻ input mặc định.
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <UploadIcon className="w-12 h-12 text-gray-500" />
        <p className="text-lg font-semibold text-gray-300">Kéo và thả ảnh vào đây</p>
        <p className="text-gray-400">hoặc</p>
        <p className="px-4 py-2 bg-gray-700 rounded-md font-medium text-white">Nhấp để chọn tệp</p>
        <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP, GIF</p>
      </div>
    </div>
  );
};

export default ImageUploader;