import React from 'react';
import { ExclamationIcon, SparklesIcon, CheckIcon } from './Icons';

// Định nghĩa kiểu cho các props của component.
interface PromptDisplayProps {
  prompts: { male: string; female: string } | null; // Đối tượng chứa prompt nam/nữ hoặc null.
  isLoading: boolean; // Cờ báo hiệu đang tải.
  error: string | null; // Chuỗi lỗi hoặc null.
  selectedPrompt: 'male' | 'female' | null; // Prompt nào đang được chọn.
  onSelectPrompt: (promptType: 'male' | 'female') => void; // Callback khi người dùng chọn một prompt.
}

/**
 * Thành phần giao diện chịu trách nhiệm hiển thị các prompt đã được tạo ra.
 * Nó có thể hiển thị nhiều trạng thái khác nhau: đang tải, lỗi, chưa có prompt, hoặc danh sách prompt.
 */
const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompts, isLoading, error, selectedPrompt, onSelectPrompt }) => {
  // --- Trường hợp 1: Đang tải (isLoading = true) ---
  if (isLoading) {
    return (
      <div className="w-full h-full flex-grow flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-4 text-center">
        <SparklesIcon className="w-10 h-10 text-indigo-400 animate-pulse" />
        <p className="mt-4 text-lg font-semibold text-gray-300">AI đang phân tích hình ảnh...</p>
        <p className="text-sm text-gray-400">Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  // --- Trường hợp 2: Có lỗi (error là một chuỗi) ---
  if (error) {
    return (
      <div className="w-full h-full flex-grow flex flex-col items-center justify-center bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
        <ExclamationIcon className="w-10 h-10 text-red-400" />
        <p className="mt-4 font-semibold text-red-300">Đã xảy ra lỗi</p>
        <p className="text-sm text-red-400 mt-1">{error}</p>
      </div>
    );
  }
  
  // --- Trường hợp 3: Chưa có prompt nào được tạo (prompts = null) ---
  if (!prompts) {
    return (
        <div className="w-full h-full flex-grow bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Prompt của bạn sẽ xuất hiện ở đây...</p>
            </div>
        </div>
    );
  }
  
  // --- Trường hợp 4: Hiển thị thành công các prompt ---
  
  // Định nghĩa các lớp CSS cơ bản và cho trạng thái active/inactive để tái sử dụng.
  const promptCardBaseClasses = "border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 relative";
  const promptCardInactiveClasses = "border-gray-700 bg-gray-900/50 hover:border-indigo-500 hover:bg-gray-800/60";
  const promptCardActiveClasses = "border-indigo-500 bg-gray-800/70 ring-2 ring-indigo-500/50";

  return (
    <div className="w-full h-full flex-grow flex flex-col overflow-y-auto space-y-4">
      {/* Thẻ hiển thị Prompt Nam */}
      <div
        onClick={() => onSelectPrompt('male')}
        // Áp dụng lớp CSS tương ứng dựa trên việc prompt này có đang được chọn hay không.
        className={`${promptCardBaseClasses} ${selectedPrompt === 'male' ? promptCardActiveClasses : promptCardInactiveClasses}`}
      >
        {/* Hiển thị icon check nếu prompt được chọn */}
        {selectedPrompt === 'male' && <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1"><CheckIcon className="w-3 h-3 text-white"/></div>}
        <h3 className="text-md font-semibold text-indigo-400 mb-2">Prompt Nam</h3>
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300">
          <p className="whitespace-pre-wrap">{prompts.male}</p>
        </div>
      </div>
      
      {/* Thẻ hiển thị Prompt Nữ */}
      <div
        onClick={() => onSelectPrompt('female')}
        className={`${promptCardBaseClasses} ${selectedPrompt === 'female' ? promptCardActiveClasses : promptCardInactiveClasses}`}
      >
        {selectedPrompt === 'female' && <div className="absolute top-2 right-2 bg-pink-600 rounded-full p-1"><CheckIcon className="w-3 h-3 text-white"/></div>}
        <h3 className="text-md font-semibold text-pink-400 mb-2">Prompt Nữ</h3>
        <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300">
          <p className="whitespace-pre-wrap">{prompts.female}</p>
        </div>
      </div>
    </div>
  );
};

export default PromptDisplay;