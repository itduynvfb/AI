import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generatePromptFromImage, editImageWithPrompt } from './services/geminiService';
import { SparklesIcon, CopyIcon, CheckIcon, XCircleIcon, PencilIcon, DownloadIcon, FacebookIcon, YouTubeIcon, CogIcon } from './components/Icons';
import ImageUploader from './components/ImageUploader';
import PromptDisplay from './components/PromptDisplay';

// --- Thành phần chính của ứng dụng ---
const App: React.FC = () => {
  // --- QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT) ---
  // Sử dụng hook `useState` của React để theo dõi và cập nhật trạng thái của ứng dụng.

  // === Trạng thái cho Bước 1: Tạo Prompt ===
  const [promptImageFile, setPromptImageFile] = useState<File | null>(null);
  const [promptImagePreviewUrl, setPromptImagePreviewUrl] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ male: string; female: string } | null>(null);
  
  // === Trạng thái cho Bước 2: Chỉnh Sửa Ảnh ===
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null);
  const [editedImagePreviewUrl, setEditedImagePreviewUrl] = useState<string | null>(null);
  const [isEditingImage, setIsEditingImage] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [selectedPromptForEditing, setSelectedPromptForEditing] = useState<'male' | 'female' | null>(null);
  const [editingPromptText, setEditingPromptText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // === Trạng thái cho Cài đặt Admin ===
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // === Trạng thái Popup Chào mừng ===
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false);

  // === Trạng thái dùng chung ===
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const step2Ref = useRef<HTMLDivElement>(null);
  
  // --- QUẢN LÝ VÒNG ĐỜI (LIFECYCLE) & SIDE EFFECTS ---

  // useEffect để kiểm tra trạng thái đăng nhập của admin từ localStorage khi component được tải lần đầu.
  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isAdminLoggedIn');
    if (loggedInStatus === 'true') {
      setIsAdminLoggedIn(true);
    }
    
    // Kiểm tra xem người dùng đã thấy popup chào mừng trong phiên này chưa.
    const hasSeenPopup = sessionStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenPopup) {
      setShowWelcomePopup(true);
    }
  }, []);


  // --- CÁC HÀM XỬ LÝ SỰ KIỆN (HANDLERS) ---
  
  // Xử lý khi người dùng nhấp vào nút "Cảm ơn" trên popup chào mừng.
  const handleAcknowledgeWelcome = () => {
    sessionStorage.setItem('hasSeenWelcomePopup', 'true');
    setShowWelcomePopup(false);
  };

  // Reset toàn bộ ứng dụng
  const handleFullReset = () => {
    setPromptImageFile(null);
    setPromptImagePreviewUrl(null);
    setIsGeneratingPrompt(false);
    setPromptError(null);
    setGeneratedPrompts(null);
    handleStep2Reset();
  };
  
  // Reset chỉ Bước 2
  const handleStep2Reset = () => {
    setEditImageFile(null);
    setEditImagePreviewUrl(null);
    setEditedImagePreviewUrl(null);
    setIsEditingImage(false);
    setEditError(null);
    setSelectedPromptForEditing(null);
    setEditingPromptText('');
    setIsCopied(false);
  };

  // Xử lý chọn ảnh Bước 1
  const handlePromptImageChange = (file: File) => {
    if (file) {
      handleFullReset();
      setPromptImageFile(file);
      setPromptImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Xử lý chọn ảnh Bước 2
  const handleEditImageChange = (file: File) => {
    if (file) {
      setEditImageFile(file);
      setEditImagePreviewUrl(URL.createObjectURL(file));
      setEditedImagePreviewUrl(null);
      setEditError(null);
    }
  };

  // Xử lý tạo prompt
  const handleGeneratePrompt = useCallback(async () => {
    if (!promptImageFile) {
      setPromptError('Vui lòng chọn một hình ảnh trước.');
      return;
    }
    
    setIsGeneratingPrompt(true);
    setPromptError(null);
    handleStep2Reset();
    
    try {
      const { malePrompt, femalePrompt } = await generatePromptFromImage(promptImageFile);
      setGeneratedPrompts({ male: malePrompt, female: femalePrompt });
      setTimeout(() => {
          step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setPromptError('Không thể tạo prompt. Vui lòng thử lại. Lỗi: ' + err.message);
      setGeneratedPrompts(null);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [promptImageFile]);

  // Xử lý chỉnh sửa ảnh
  const handleEditImage = useCallback(async () => {
      if (!editImageFile) {
          setEditError("Vui lòng tải lên một hình ảnh để chỉnh sửa.");
          return;
      }
      if (!editingPromptText.trim()) {
          setEditError("Vui lòng cung cấp một prompt để chỉnh sửa hình ảnh.");
          return;
      }
      setIsEditingImage(true);
      setEditError(null);
      setEditedImagePreviewUrl(null);

      try {
          const editedImageBase64 = await editImageWithPrompt(editImageFile, editingPromptText);
          setEditedImagePreviewUrl(`data:image/png;base64,${editedImageBase64}`);
      } catch (err: any) {
          setEditError('Không thể chỉnh sửa ảnh. Vui lòng thử lại. Lỗi: ' + err.message);
      } finally {
          setIsEditingImage(false);
      }
  }, [editImageFile, editingPromptText]);
  
  // Xử lý sao chép
  const handleCopyPrompt = () => {
    if (generatedPrompts) {
      const textToCopy = `Prompt Nam:\n${generatedPrompts.male}\n\nPrompt Nữ:\n${generatedPrompts.female}`;
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Xử lý tải ảnh
  const handleDownloadImage = () => {
      if(editedImagePreviewUrl) {
          const link = document.createElement('a');
          link.href = editedImagePreviewUrl;
          link.download = `edited-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }

  // Xử lý chọn prompt
  const handleSelectPrompt = (promptType: 'male' | 'female') => {
    if (generatedPrompts) {
        setSelectedPromptForEditing(promptType);
        setEditingPromptText(generatedPrompts[promptType]);
    }
  };

  // Xử lý đăng nhập admin
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'admin' && passwordInput === 'Hd543211') {
        setIsAdminLoggedIn(true);
        localStorage.setItem('isAdminLoggedIn', 'true');
        setLoginError(null);
        setUsernameInput('');
        setPasswordInput('');
    } else {
        setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  // Xử lý đăng xuất admin
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('isAdminLoggedIn');
  };
  
  // --- CẤU TRÚC GIAO DIỆN (JSX) ---
  return (
    <>
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-6xl mx-auto bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-900/30 border border-white/10 overflow-hidden">
          <header className="p-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20">
            <div className="flex flex-col md:flex-row items-center gap-2 md:space-x-4 text-center md:text-left">
              <SparklesIcon className="w-8 h-8 text-indigo-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Tạo Prompt và chỉnh sửa ảnh</h1>
                <p className="text-gray-400 text-sm sm:text-base">Tạo prompt AI từ hình ảnh và chỉnh sửa ảnh ngay lập tức</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Cài đặt"
            >
              <CogIcon className="w-6 h-6 text-gray-400"/>
            </button>
          </header>

          <main className="flex flex-col gap-px bg-white/10">
              {/* --- BƯỚC 1: TẠO PROMPT --- */}
              <div className="bg-gray-800/60 p-6">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-white font-bold text-lg">1</div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Tải Ảnh Lên Để Tạo Prompt</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col items-center justify-center min-h-[300px]">
                        {promptImagePreviewUrl ? (
                              <div className="w-full h-full flex flex-col items-center justify-center relative group">
                                  <img src={promptImagePreviewUrl} alt="Xem trước ảnh cho prompt" className="max-w-full max-h-80 object-contain rounded-lg shadow-lg" />
                                  <button onClick={handleFullReset} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 z-10">
                                      <XCircleIcon className="w-6 h-6"/>
                                  </button>
                              </div>
                          ) : (
                              <ImageUploader onImageUpload={handlePromptImageChange} />
                          )}
                      </div>

                      <div className="flex flex-col">
                          <div className="flex-grow">
                              <PromptDisplay 
                                  prompts={generatedPrompts}
                                  isLoading={isGeneratingPrompt}
                                  error={promptError}
                                  selectedPrompt={selectedPromptForEditing}
                                  onSelectPrompt={handleSelectPrompt}
                              />
                          </div>
                          {/* Khu vực điều khiển cho Bước 1 */}
                          <div className="mt-4 flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={handleGeneratePrompt}
                                    disabled={!promptImageFile || isGeneratingPrompt || isEditingImage}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 text-sm md:text-base"
                                >
                                    {isGeneratingPrompt ? 'Đang tạo...' : (generatedPrompts ? 'Tạo Lại Prompt' : 'Tạo Prompt')}
                                </button>
                                <button
                                    onClick={handleCopyPrompt}
                                    disabled={!generatedPrompts || isGeneratingPrompt}
                                    className="w-full px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 text-sm md:text-base"
                                >
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                    {isCopied ? 'Đã sao chép!' : 'Sao chép Prompts'}
                                </button>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* --- BƯỚC 2: CHỈNH SỬA ẢNH --- */}
              <div ref={step2Ref} className="bg-gray-800/60 p-6">
                  <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-lg bg-green-600">2</div>
                      <h2 className="text-lg md:text-xl font-bold text-white">Dùng Prompt Để Chỉnh Sửa Ảnh</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="flex flex-col min-h-[300px]">
                          {!editImagePreviewUrl ? (
                              <div className="flex items-center justify-center h-full">
                                  <ImageUploader onImageUpload={handleEditImageChange} />
                              </div>
                          ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full">
                                  <div className="relative group">
                                      <h3 className="text-center font-semibold mb-2 text-gray-300">Ảnh Gốc</h3>
                                      <div className="aspect-square bg-black/20 rounded-lg flex items-center justify-center">
                                          <img src={editImagePreviewUrl} alt="Ảnh gốc để chỉnh sửa" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                      </div>
                                      <button onClick={handleStep2Reset} className="absolute top-0 right-0 mt-10 mr-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 z-10">
                                        <XCircleIcon className="w-6 h-6"/>
                                      </button>
                                  </div>

                                  <div className="relative flex flex-col items-center bg-black/20 rounded-lg aspect-square p-3 space-y-2">
                                      <h3 className="text-center font-semibold text-gray-300 flex-shrink-0">Ảnh Đã Sửa</h3>
                                      <div className="w-full flex-grow relative flex items-center justify-center min-h-0">
                                          {isEditingImage && (
                                              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
                                                  <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                  <p className="text-white font-semibold">AI đang chỉnh sửa...</p>
                                              </div>
                                          )}
                                          {editedImagePreviewUrl ? (
                                              <img 
                                                src={editedImagePreviewUrl} 
                                                alt="Ảnh đã được chỉnh sửa" 
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setIsModalOpen(true)}
                                              />
                                          ) : (
                                              !isEditingImage && <p className="text-gray-500 text-center">Kết quả sẽ xuất hiện ở đây</p>
                                          )}
                                      </div>
                                      <div className="w-full flex-shrink-0">
                                        {editedImagePreviewUrl && (
                                            <button
                                                onClick={handleDownloadImage}
                                                disabled={isEditingImage}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 text-sm md:text-base"
                                            >
                                                <DownloadIcon className="w-5 h-5" /> Tải Về Ảnh
                                            </button>
                                        )}
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                      <div className="flex flex-col">
                          <div className="flex-grow">
                              <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-2">Chọn một prompt ở trên hoặc viết prompt của riêng bạn:</label>
                              <textarea
                                  id="custom-prompt"
                                  rows={5}
                                  className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                  value={editingPromptText}
                                  onChange={(e) => setEditingPromptText(e.target.value)}
                                  placeholder="Ví dụ: thay đổi áo khoác thành màu đỏ, thêm một con mèo..."
                              />
                              {editError && <p className="text-red-400 text-sm mt-2">{editError}</p>}
                          </div>
                           <div className="mt-4">
                               <button
                                  onClick={handleEditImage}
                                  disabled={!editingPromptText.trim() || !editImageFile || isEditingImage || isGeneratingPrompt}
                                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 text-sm md:text-base"
                              >
                                  {isEditingImage ? 'Đang chỉnh sửa...' : <><PencilIcon className="w-5 h-5" /> Chỉnh Sửa Ảnh</>}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
        </div>
        <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-6 text-gray-500 text-sm">
          <p className="text-center md:text-left">Cung cấp bởi Gemini AI, phát triển bởi ALPHATECH</p>
          <div className="flex items-center space-x-4">
            <a href="https://www.facebook.com/hopevn.info" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors">
                <FacebookIcon className="w-6 h-6" />
            </a>
            <a href="https://youtube.com/hopeofficialvn?sub_confirmation=1" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-white transition-colors">
                <YouTubeIcon className="w-6 h-6" />
            </a>
          </div>
        </footer>
      </div>

      {/* Modal xem ảnh phóng to */}
      {isModalOpen && editedImagePreviewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={editedImagePreviewUrl} alt="Ảnh đã chỉnh sửa - phóng to" className="object-contain max-w-full max-h-[90vh] rounded-lg" />
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-transform transform hover:scale-110"
              aria-label="Đóng"
            >
              <XCircleIcon className="w-8 h-8"/>
            </button>
          </div>
        </div>
      )}

      {/* Modal Cài đặt Admin */}
      {isSettingsModalOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsSettingsModalOpen(false)}
          >
            <div 
              className="relative bg-gray-800/80 border border-white/10 rounded-lg shadow-xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white"
                  aria-label="Đóng"
              >
                  <XCircleIcon className="w-6 h-6"/>
              </button>

              {isAdminLoggedIn ? (
                // --- Giao diện sau khi đăng nhập thành công ---
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Bảng Điều Khiển</h2>
                  <p className="text-gray-300 mb-6">Chào mừng, Admin! Các tính năng quản lý sẽ được cập nhật tại đây.</p>
                  <button
                    onClick={handleAdminLogout}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                // --- Biểu mẫu đăng nhập ---
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Đăng Nhập Quản Trị</h2>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="username">Tên đăng nhập</label>
                      <input 
                        type="text" 
                        id="username" 
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Mật khẩu</label>
                      <input 
                        type="password" 
                        id="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                    <button 
                      type="submit"
                      className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                      Đăng Nhập
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
      )}
      
      {/* Popup Chào mừng */}
      {showWelcomePopup && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div 
            className="relative bg-gray-800/80 border border-white/10 rounded-lg shadow-xl w-full max-w-md p-8 text-center"
          >
            <SparklesIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4"/>
            <h2 className="text-xl font-bold text-white mb-6">
              Hãy cảm ơn Duy đẹp trai trước khi thực hiện chỉnh sửa
            </h2>
            <button
              onClick={handleAcknowledgeWelcome}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              Cảm ơn
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;