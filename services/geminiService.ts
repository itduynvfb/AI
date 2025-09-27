import { GoogleGenAI, Modality, Type } from "@google/genai";

// Kiểm tra xem API key đã được cung cấp trong biến môi trường chưa.
// Đây là một bước bảo mật quan trọng để tránh lộ key trong mã nguồn.
if (!process.env.API_KEY) {
  throw new Error("API_KEY chưa được thiết lập trong biến môi trường.");
}

// Khởi tạo một thực thể của GoogleGenAI với API key.
// Đây là đối tượng chính để tương tác với các mô hình của Gemini.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Hàm tiện ích chuyển đổi một đối tượng File sang chuỗi Base64.
 * Base64 là định dạng cần thiết để gửi dữ liệu hình ảnh qua API dưới dạng inline data.
 * @param {File} file - File ảnh cần chuyển đổi.
 * @returns {Promise<string>} - Một promise sẽ trả về chuỗi Base64 của ảnh.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Kết quả đọc file là một data URL (ví dụ: "data:image/jpeg;base64,LzlqLz...").
      // Chúng ta chỉ cần phần dữ liệu Base64 sau dấu phẩy.
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Gửi một hình ảnh đến Gemini API để tạo ra hai prompt mô tả bằng TIẾNG ANH.
 * @param {File} imageFile - File ảnh mà người dùng đã tải lên.
 * @returns {Promise<{ malePrompt: string; femalePrompt: string }>} - Một promise trả về đối tượng chứa hai prompt.
 */
export const generatePromptFromImage = async (imageFile: File): Promise<{ malePrompt: string; femalePrompt: string }> => {
  try {
    const base64Image = await fileToBase64(imageFile);

    // Chuẩn bị phần dữ liệu hình ảnh cho yêu cầu API.
    const imagePart = {
      inlineData: {
        mimeType: imageFile.type, // Loại file (ví dụ: 'image/jpeg')
        data: base64Image,       // Dữ liệu base64
      },
    };

    // Định nghĩa các mẫu prompt mặc định trực tiếp trong hàm.
    const malePromptInstruction = `Create a concise, artistic prompt in English for a male subject based on the image. Focus on style, setting, and action.`;
    const femalePromptInstruction = `Create a concise, artistic prompt in English for a female subject based on the image. Adjust clothing appropriately. Focus on style, setting, and action.`;

    // Chuẩn bị phần văn bản (hướng dẫn) cho yêu cầu API.
    const textPart = {
      text: `From the provided image, generate two distinct artistic prompts in English.

      1.  **For the Male Prompt:** Follow this instruction: "${malePromptInstruction}"
      2.  **For the Female Prompt:** Follow this instruction: "${femalePromptInstruction}"
      
      Return the result as a single, valid JSON object with the keys 'malePrompt' and 'femalePrompt'.`,
    };

    // Gửi yêu cầu đến mô hình 'gemini-2.5-flash'.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }, // Gửi cả ảnh và văn bản
        config: {
          // Yêu cầu API trả về kết quả dưới dạng JSON.
          responseMimeType: "application/json",
          // Định nghĩa cấu trúc (schema) của JSON mong muốn để đảm bảo tính nhất quán.
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              malePrompt: {
                type: Type.STRING,
                description: 'An artistic, concise prompt in English with a male subject.'
              },
              femalePrompt: {
                type: Type.STRING,
                description: 'An artistic, concise prompt in English with a female subject.'
              },
            },
            required: ['malePrompt', 'femalePrompt'],
          },
        }
    });

    // Trích xuất và kiểm tra phần văn bản từ phản hồi.
    const text = response.text;
    if (!text) {
        // Nếu không có text, kiểm tra lý do kết thúc (ví dụ: bị chặn vì an toàn).
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
             throw new Error(`Quá trình tạo prompt đã bị dừng vì: ${finishReason}.`);
        }
        throw new Error("API đã trả về một phản hồi trống.");
    }
    
    // Phân tích chuỗi JSON thành đối tượng JavaScript và trả về.
    return JSON.parse(text);
  } catch (error) {
    console.error("Lỗi khi giao tiếp với Gemini API:", error);
    if (error instanceof Error) {
        throw error; // Ném lại lỗi gốc để giữ nguyên thông điệp lỗi.
    }
    throw new Error("Không thể tạo prompt từ hình ảnh do một lỗi không xác định.");
  }
};


/**
 * Gửi một hình ảnh và một prompt đến Gemini API để chỉnh sửa hình ảnh đó.
 * @param {File} imageFile - File ảnh gốc cần chỉnh sửa.
 * @param {string} prompt - Văn bản mô tả yêu cầu chỉnh sửa.
 * @returns {Promise<string>} - Một promise trả về chuỗi Base64 của hình ảnh đã được chỉnh sửa.
 */
export const editImageWithPrompt = async (imageFile: File, prompt: string): Promise<string> => {
    try {
        const base64Image = await fileToBase64(imageFile);

        // Chuẩn bị phần dữ liệu hình ảnh.
        const imagePart = {
            inlineData: {
                mimeType: imageFile.type,
                data: base64Image,
            },
        };
        
        // Chuẩn bị phần văn bản (prompt chỉnh sửa).
        const textPart = {
            text: prompt,
        };
        
        // Gửi yêu cầu đến mô hình chỉnh sửa ảnh 'gemini-2.5-flash-image-preview'.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                // Yêu cầu API trả về cả hình ảnh và văn bản.
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        // Truy cập an toàn vào mảng các phần trong phản hồi.
        const parts = response?.candidates?.[0]?.content?.parts;

        if (parts) {
            // Lặp qua các phần để tìm phần chứa dữ liệu hình ảnh.
            for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return part.inlineData.data; // Trả về dữ liệu base64 của ảnh đã sửa.
                }
            }
        }
        
        // Nếu không tìm thấy phần hình ảnh, kiểm tra lý do.
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
            // Cung cấp lỗi cụ thể hơn nếu bị dừng vì lý do an toàn (SAFETY) hoặc lý do khác.
            throw new Error(`Quá trình tạo ảnh đã bị dừng vì: ${finishReason}. Vui lòng sửa đổi prompt của bạn.`);
        }

        // Lỗi chung nếu không có hình ảnh được trả về.
        throw new Error("API không trả về hình ảnh đã chỉnh sửa. Phản hồi có thể đã bị chặn.");

    } catch (error) {
        console.error("Lỗi khi chỉnh sửa ảnh với Gemini API:", error);
        // Ném lại lỗi để thành phần UI có thể bắt và hiển thị thông báo.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Không thể chỉnh sửa hình ảnh do một lỗi không xác định.");
    }
};
