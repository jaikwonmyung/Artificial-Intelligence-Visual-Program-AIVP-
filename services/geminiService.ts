
import { GoogleGenAI } from "@google/genai";
import { ImageFile, ImageSize } from "../types";
import { DEFAULT_POSITIVE_PROMPT, DEFAULT_NEGATIVE_PROMPT, MODEL_NAME_PRO, MODEL_NAME_TURBO } from "../constants";

// Helper to check/request API Key for Pro models
export const ensureApiKey = async (): Promise<boolean> => {
  // @ts-ignore - window.aistudio is injected by the environment
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    }
    return true;
  }
  // Check process.env or localStorage
  return !!(process.env.API_KEY || localStorage.getItem('gemini_api_key'));
};

export const setStoredApiKey = (key: string) => {
  localStorage.setItem('gemini_api_key', key);
};

export const clearStoredApiKey = () => {
  localStorage.removeItem('gemini_api_key');
};

export const openApiKeySelection = async () => {
  // @ts-ignore
  if (window.aistudio && window.aistudio.openSelectKey) {
    // @ts-ignore
    await window.aistudio.openSelectKey();
  } else {
    // Fallback: Trigger a custom event or let the UI handle it via state
    // For now, we'll just return and let the UI show the input if ensureApiKey fails
    console.warn("No native API key selection available. Use UI input.");
  }
};

export const generateImage = async (
  userPrompt: string,
  referenceImages: (ImageFile | null)[],
  size: ImageSize,
  isTurbo: boolean,
  isCameraControlEnabled: boolean,
  seed?: number | null,
  aspectRatio: string = "16:9",
  isMasterFixed: boolean = false,
  isThinkingMode: boolean = false
): Promise<string> => {

  const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("API Key not found. Please enter your API Key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Select Model
  const modelName = isTurbo ? MODEL_NAME_TURBO : MODEL_NAME_PRO;

  // Filter valid images
  const validRefs = referenceImages.filter(img => img !== null) as ImageFile[];
  const masterRef = validRefs[0];
  const assetRefs = validRefs.slice(1);

  // Prompt Engineering
  let effectivePrompt = userPrompt;

  // Keyword Detection for Strictness
  const strictKeywords = [
    "구도", "composition", "perspective", "angle", "layout", "structure", // Nouns
    "유지", "keep", "maintain", "fix", "preserve", "lock", "same", "identical", "original" // Verbs/Adjectives
  ];
  // Strict intent is true if user asked for it OR if they clicked the "Lock Master" button
  const hasStrictIntent = isMasterFixed || strictKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword.toLowerCase()));

  if (isCameraControlEnabled) {
    const cameraKeywords = [
      "Cinematic Camera", "Dynamic Angle", "Low Angle Perspective",
      "Wide Angle 24mm", "Depth of Field (Bokeh)", "Motion Blur",
      "High Contrast Lighting", "Dramatic Composer"
    ];
    effectivePrompt = `${cameraKeywords.join(', ')} . ${userPrompt}`;
  }

  // Construct the engineered prompt with Master & Assets Logic
  const finalPrompt = `
    [TASK]
    Generate a ${isTurbo ? 'rapid prototype' : 'high-fidelity'} image based on the following instructions.

    [USER PROMPT]
    ${effectivePrompt}
    
    [VISUAL QUALITY STANDARDS]
    ${DEFAULT_POSITIVE_PROMPT}

    [VISUAL QUALITY STANDARDS]
    ${DEFAULT_POSITIVE_PROMPT}

    ${isThinkingMode ? `
    [CRITICAL: THINKING PROCESS ACTIVATION]
    Before generating the pixels, you must perform a **PHYSICS SIMULATION** in your processing core.
    1. **DECONSTRUCT**: Break down the Master Reference into a 3D Mesh. Identify the Vanishing Point (x,y,z) and Light Source Vector (x,y,z).
    2. **CALCULATE**: Compute the Ray Tracing paths for the new object. Where does the shadow fall? Calculate the Fresnel reflection coefficient for the floor.
    3. **RENDER**: Only after these calculations, generate the final image.
    *Do not output the text of this thought process, but EXECUTE it heavily.*
    ` : ''}

    [CAMERA OVERRIDE - ${isCameraControlEnabled ? 'ACTIVE (HIGHEST PRIORITY)' : 'INACTIVE'}]
    ${isCameraControlEnabled ? `
    CRITICAL INSTRUCTION: The user has requested a specific camera angle (e.g., "Low angle", "Top view").
    1. [SPATIAL RECONSTRUCTION]: Mentally reconstruct the 3D environment of the MASTER REFERENCE. Understand its floor plan and ceiling height.
    2. [CAMERA REPOSITIONING]: Place a virtual camera in this reconstructed space matching the User Prompt's angle.
    3. [CONSISTENCY]: Retain the architectural identity, materials, and key landmarks of the MASTER REFERENCE. Do NOT create a random new room.
    4. [RENDER]: Generate the image from this NEW perspective, ensuring correct foreshortening and vanishing points.
    ` : 'Follow the reference logic below.'}

    [REFERENCE LOGIC & HIERARCHY]
    The user has provided ${validRefs.length} reference images. Their specific roles are defined below, but valid [USER PROMPT] instructions ALWAYS take precedence.

    DEFAULT ROLES:
    - IMAGE 1 (System Label: MASTER): ${hasStrictIntent ? '**SPATIAL CONTAINER (CAMERA & LIGHTING LOCKED)**. Preserve the environment, floor, walls, and lighting exactly. BUT -> You must **COMPLETELY REPLACE** specific subjects if the prompt asks.' : 'Spatial & Structural Base. You may optimize the composition slightly for better aesthetics.'}
    - IMAGE 2+ (System Label: ASSET): The object/character that **PHYSICALLY REPLACES** the subject in IMAGE 1.

    ${isMasterFixed ? `
    [CRITICAL INSTRUCTION: OUTPAINTING & RATIO ADAPTATION]
    ... (Ratio logic remains same)
    ` : ''}

    [CRITICAL INSTRUCTION: TRUE 3D REPLACEMENT (NOT OVERLAY)]
    The user is complaining that previous results looked like "stickers". You must fix this.
    
    1. **DESTRUCTIVE REPLACEMENT**: If the prompt implies changing an object (e.g. "change the bag", "replace the chair"), mentally **ERASE** the original object from the 3D space first. 
       - Do NOT blend the new object on top of the old one.
       - The old object must be GONE.
    
    2. **VOLUMETRIC INSERTION**: Place the new object (from Image 2) into the *empty void* left by the erased object.
       - It must occupy **3D VOLUME**.
       - It must have **SELF-SHADOWING**.
       - It must match the **PERSPECTIVE DISTORTION** of the original lens.
    
    3. **ENVIRONMENTAL INTERACTION**:
       - If the original object cast a shadow on the floor, the NEW object must cast a NEW shadow matching the *same* light source directions.
       - If the object is held by a hand, the hand must *grip* the NEW object naturally (modify fingers/grip if needed).

    
    MODE A: [FLAT / PORTRAIT / EXTRACT]
    ...

    MODE B: [SPATIAL / ARCHITECTURAL] (Default)
    - Trigger keywords: "Room", "Space", "Interior", "Store", "Design", "Architecture".
    ${isMasterFixed ? `
    [CRITICAL PROTOCOL: STRUCTURE LOCK ACTIVATED]
    The user has explicitly activated **STRUCTURE LOCK**.
    1. **GEOMETRY & PERSPECTIVE**: You MUST NOT change the camera angle, focal length, or perspective of IMAGE 1. They are immutable.
    2. **SPATIAL ANCHOR**: The walls, floor, ceiling, and major architectural elements of IMAGE 1 must remain in the EXACT same positions.
    3. **ALLOWABLE CHANGES**: You MAY change materials, lighting color, and time of day (unless told otherwise), but the *shapes* must stay completely identical.
    4. **SUBJECT REPLACEMENT**: You can replace objects within the scene, but they must sit on the *existing* floor plane with correct perspective.
    ` : `
    [PROTOCOL: SPATIAL RECONSTRUCTION (Structure Free)]
    - Use IMAGE 1 (MASTER) as the base inspiration.
    - You are permitted to **OPTIMIZE** the camera angle for better composition.
    - You may slightly widen or narrow the FOV to fit new subjects better.
    - Prioritize artistic cohesion over strict pixel-perfect structural adherence.
    `}

    ${isMasterFixed ? `
    - **ACTION**: **LOCK ARCHITECTURE, SWAP CONTENT.**
    - If the user says "Pink Room", paint the *existing* walls pink. Do NOT generate a *new* pink room.
    - If the user says "Add a chair", place it on the *existing* floor.
    ` : `
    - **ACTION**: **RE-IMAGINE SPACE.**
    - If the user says "Pink Room", you can generate a brand new pink room that *feels* like the reference but isn't identical.
    `}

    [SPECIFIC ROLE OVERRIDES]
    - IF the user says "Use Image 2 for space" or "Background from second image", YOU MUST treat IMAGE 2 as the Spatial Blueprint and IMAGE 1 as an Asset/Style source.
    - IF no specific roles are mentioned, strictly follow the DEFAULT ROLES.

    [SYNTHESIS GUIDELINES]
    1. [STRUCTURE]: IMAGE 1 (Master) dictates the geometry. ${hasStrictIntent ? '**Do not rotate, zoom, or pan the camera.**' : 'Use it as the foundation.'}
    2. [CONTENT]: The other reference images provide objects, materials, or style to be integrated into that space.
    3. [HARMONIZATION]: Ensure lighting, shadows, and perspective of inserted assets match the designated spatial master.

    [CRITICAL: HYPER-REALISTIC PHYSICS ENGINE SIMULATION]
    You are not just pasting images; you are a **PHYSICS SIMULATOR**.
    
    1. **LIGHT VECTOR MATCHING (RAY TRACING LOGIC)**:
       - Analyze the shadows in Image 1 (Master) to pinpoint the exact Key Light direction (e.g., Top-Left 45 degrees, Softbox, Sun).
       - APPLY this exact light vector to the new object.
       - The inserted object MUST have a Highlight (Key), Core Shadow, and Reflected Light (Bounce) that matches the Master scene perfectly.

    2. **CONTACT SHADOWS (AMBIENT OCCLUSION)**:
       - **FORBIDDEN**: Floating objects.
       - **MANDATORY**: Create deep, dark 'Contact Occlusion' where the object touches the ground/surface. The shadow must be darkest at the contact point and fade out (soften) as it extends.
    
    3. **MATERIAL INTERACTION (FRESNEL & CAUSTICS)**:
       - If the floor is glossy, generating a **distorted reflection** of the object is MANDATORY.
       - If the object is transparent/translucent, generate **caustics** (light refraction) on the floor.
       - **COLOR BLEED**: If the new object is Red and sits on a White floor, the floor near it must have a slight reddish tint (Global Illumination).


    [NEGATIVE CONSTRAINTS - THE "UNCANNY VALLEY" FILTER]
    - **NO CUT-OUTS**: The object edges must not look like a 2D cut-out. Light must wrap around the edge (Subsurface Scattering for organic objects, Fresnel for hard objects).
    - **NO MISMATCHED NOISE**: The film grain/ISO noise of the new object must match the background specifically.
    STRICT GROUNDING: Do not invent objects not implied by the prompt. If the user asks for a 'face', do not add a 'hat' or 'glasses' unless specified.
    Ensure the image does NOT contain: ${DEFAULT_NEGATIVE_PROMPT}
`;

  const parts: any[] = [];

  // Add text prompt
  parts.push({ text: finalPrompt });

  // Add Reference Images (Master first, then Assets)
  validRefs.forEach(ref => {
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.base64
      }
    });
  });

  try {
    // Prepare Config
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    };

    // Flash model does NOT support imageSize, Pro model DOES.
    // Only add imageSize if NOT in Turbo mode.
    if (!isTurbo) {
      config.imageConfig.imageSize = size;
    }

    // Add seed if provided
    if (seed !== null && seed !== undefined) {
      console.log(`[GeminiService] Using Fixed Seed: ${seed}`);
      config.imageConfig.seed = seed;
    } else {
      console.log(`[GeminiService] Using Random Seed`);
    }

    // Retry Logic
    const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
      try {
        return await fn();
      } catch (error: any) {
        if (retries === 0) throw error;

        // Retry on network errors or 5xx server errors
        const isRetryable = error.message.includes('fetch') || error.message.includes('network') || (error.status && error.status >= 500);

        if (isRetryable) {
          console.warn(`API Error. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config,
      // UNLEASH THE BEAST: Disable all safety filters to prevent blocking complex/artistic outputs
      // @ts-ignore - safetySettings IS supported by the API but type definitions might be lagging
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
      // @ts-ignore - httpOptions is supported at runtime for timeout
      httpOptions: {
        timeout: isThinkingMode ? 300000 : 120000, // 5 mins (Deep) vs 2 mins (Standard)
      }
    }));

    // Extract image from response
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in the response.");

  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};

export const editImage = async (
  baseImageBase64: string,
  maskImageBase64: string,
  prompt: string,
  referenceImageBase64?: string
): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("API Key not found. Please enter your API Key.");

  const ai = new GoogleGenAI({ apiKey });

  const finalPrompt = `
    [TASK]
    In-paint the provided image based on the mask and the user prompt.
    
    [USER PROMPT]
    ${prompt}

    ${referenceImageBase64 ? `
    [REFERENCE IMAGE GUIDANCE]
    The user has provided a SPECIFIC REFERENCE IMAGE (Standard Image 3) to guide the inpainting.
    1. **STYLE/CONTENT MATCH**: The object or content generated within the masked area MUST closely resemble the Reference Image in terms of shape, color, texture, and style.
    2. **CONTEXTUAL ADAPTATION**: While matching the Reference Image, ensure it is physically and lighting-wise integrated into the Base Image scene. Do not just "paste" it; render it as if it belongs there (matching shadows, lighting direction).
    ` : ''}

    [CRITICAL INSTRUCTION: BLENDING & HARMONIZATION]
    The first image is the BASE IMAGE (which may contain a rough overlay).
    The second image is the MASK (White = Edit, Black = Keep).
    ${referenceImageBase64 ? 'The third image is the REFERENCE IMAGE.' : ''}
    
    1. [INTENT INTERPRETATION]: 
       - If the User Prompt is specific (e.g., "Add a red vase"), follow it exactly.
       - If the User Prompt is VAGUE (e.g., "Change", "Fix", "Improve"), you must **INFER** the best improvement based on the surrounding context. Usually, this means removing artifacts, enhancing realism, or completing the object cut off by the mask.
    
    2. [SEAMLESS INTEGRATION]: The content generated in the masked area MUST blend perfectly with the surrounding pixels.
    3. [LIGHTING MATCH]: Analyze the lighting direction, intensity, and color temperature of the BASE IMAGE. Apply the SAME lighting to the generated content.
    4. [SHADOWS & REFLECTIONS]: Cast realistic shadows from the generated object onto the base scene. If the floor is reflective, generate appropriate reflections.
    5. [TEXTURE MATCH]: Match the noise level and texture quality of the base image.
    
    DO NOT just paste the object. It must look like it physically belongs in the scene.
  `;

  const parts: any[] = [
    { text: finalPrompt },
    { inlineData: { mimeType: 'image/png', data: baseImageBase64 } },
    { inlineData: { mimeType: 'image/png', data: maskImageBase64 } }
  ];

  if (referenceImageBase64) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: referenceImageBase64 } });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME_PRO,
      contents: { parts },
      config: {
        // @ts-ignore
        imageConfig: { aspectRatio: "16:9" } // Maintain aspect ratio
      }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    console.error("Edit Error:", error);
    throw new Error(error.message || "Failed to edit image.");
  }
};

export const upscaleImage = async (imageBase64: string): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("API Key not found. Please enter your API Key.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    [TASK]
    Upscale this image to 4K resolution. 
    Enhance details, sharpen textures, and remove artifacts. 
    Maintain the exact composition and content. 
    Output a high-fidelity version.
  `;

  const parts = [
    { text: prompt },
    { inlineData: { mimeType: 'image/png', data: imageBase64 } }
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME_PRO,
      contents: { parts },
      // @ts-ignore
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error: any) {
    console.error("Upscale Error:", error);
    throw new Error(error.message || "Failed to upscale image.");
  }
};

export const fileToCtx = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimization: Resize image to max 1536px to speed up upload/processing
        const MAX_SIZE = 1536;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG 0.85
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = optimizedDataUrl.split(',')[1];

        resolve({
          file,
          previewUrl: optimizedDataUrl, // Use optimized version for preview too (faster rendering)
          base64,
          mimeType: 'image/jpeg' // Always sending JPEG for efficiency
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const enhancePrompt = async (inputPrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("API Key not found.");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are the "Architect", a highly advanced prompt engineering system designed for Google's Gemini and Imagen models.
    Your goal is to translate simple user intentions into **PRODUCTION-READY SCENE DESCRIPTIONS** in a single, highly detailed paragraph.

    [INPUT ANALYZER]
    User Input: "${inputPrompt}"

    [GENERATION PROTOCOL]
    1. **EXPAND**: Convert vague concepts into concrete visual details (e.g. "car" -> "Matte Black Lamborghini Countach LPI 800-4").
    2. **PHYSICS**: Define specific lighting, texture, and optical properties (e.g., "Cinematic lighting", "Octane Render", "Ray Tracing").
    3. **OUTPUT**: Return a **SINGLE, COHESIVE PARAGRAPH** of text. Do NOT use JSON. Do NOT use Markdown blocks.

    [STYLE GUIDE]
    - Use professional photography terminology.
    - Focus on Lighting, Composition, Materiality, and Atmosphere.
    - Be concise but evocative.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-pro",
      contents: {
        parts: [{ text: systemInstruction }]
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    });

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      const text = response.candidates[0].content.parts[0].text;
      return text ? text.trim() : inputPrompt;
    }
    throw new Error("No candidates returned from Gemini");
  } catch (error: any) {
    console.error("Prompt Enhancement Failed:", error);

    // DEBUG: Attempt to list models to see what IS allowed
    try {
      const models = await ai.models.list();
      const modelNames = models.map((m: any) => m.name).slice(0, 5).join(", ");
      throw new Error(`${error.message} (Available: ${modelNames})`);
    } catch (listError) {
      throw error; // If list fails, just throw original
    }
  }
};
export const changeView = async (
  baseImageBase64: string,
  direction: 'TOP' | 'FRONT' | 'LEFT' | 'RIGHT'
): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("API Key not found.");

  const ai = new GoogleGenAI({ apiKey });

  // STEP 1: Vision Analysis (Gemini 1.5 Pro)
  const analysisPrompt = `
    [TASK]
    You are an expert 3D Spatial Architect and Photographer.
    Analyze the provided image deeply to understand the 3D geometry, spatial depth, and object relations.
    Your goal is to "virtually move the camera" and describe the scene from a new **${direction} VIEW**.

    [DIRECTION SPECIFICS]
    ${direction === 'TOP' ? '- **TRUE BIRD\'S EYE VIEW**: Position camera directly above (90-degree down angle). Infer the hidden floor plan, rug shapes, and top surfaces of objects. Show the spatial layout clearly.' : ''}
    ${direction === 'FRONT' ? '- **FRONTAL EYE-LEVEL**: Position camera directly in front at eye level. Flatten perspective to show the "face" of the subject/scene perfectly.' : ''}
    ${direction === 'LEFT' ? '- **ORBIT LEFT 45°**: Rotate camera 45 degrees to the left around the subject. Maintain original horizon/vertical axis. Reveal the left side depth and infer background details previously hidden.' : ''}
    ${direction === 'RIGHT' ? '- **ORBIT RIGHT 45°**: Rotate camera 45 degrees to the right around the subject. Maintain original horizon/vertical axis. Reveal the right side depth and infer background details previously hidden.' : ''}

    [INFERENCE PROTOCOL]
    1. **GEOMETRY & OCCLUSION**: When rotating, logically infer what was behind the object (e.g., extend the wall texture, complete the side of the chair).
    2. **LIGHTING CONTINUITY**: Keep the same light sources. If the side is in shadow, describe it as such.
    3. **OUTPUT**: A detailed, high-fidelity rendering prompt describing this new angle.
    4. NO PREAMBLE. JUST THE PROMPT.
  `;

  try {
    console.log(`[changeView] Step 1: Converting Image to ${direction} Description...`);
    // Use standard models.generateContent for Vision too
    const visionResponse = await ai.models.generateContent({
      model: "gemini-1.5-pro-001",
      contents: {
        parts: [
          { text: analysisPrompt },
          { inlineData: { mimeType: "image/png", data: baseImageBase64 } }
        ]
      }
    });

    let newPrompt = "";
    if (visionResponse.candidates && visionResponse.candidates[0] && visionResponse.candidates[0].content && visionResponse.candidates[0].content.parts) {
      newPrompt = visionResponse.candidates[0].content.parts[0].text || "";
    }

    if (!newPrompt) throw new Error("Vision analysis failed to return text.");

    console.log(`[changeView] Step 1 Success. New Prompt:`, newPrompt.substring(0, 50) + "...");

    // STEP 2: Image Generation (Imagen 3)
    console.log(`[changeView] Step 2: Generating Image...`);

    const imageResponse = await ai.models.generateContent({
      model: MODEL_NAME_PRO,
      contents: { parts: [{ text: newPrompt }] },
      config: {
        // @ts-ignore
        imageConfig: { aspectRatio: "16:9" }
      },
      // @ts-ignore
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    });

    if (imageResponse.candidates && imageResponse.candidates[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Step 2 generation failed (No image returned).");

  } catch (error: any) {
    console.error("View Change Error:", error);
    throw new Error(error.message || "Failed to change view.");
  }
};

// Helper for Part construction
function displayImage(base64: string) {
  return {
    inlineData: {
      data: base64,
      mimeType: "image/png"
    }
  };
}
