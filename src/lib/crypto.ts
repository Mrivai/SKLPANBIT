import CryptoJS from 'crypto-js';

const SECRET_KEY = 'skl-panbit-secret-key-123'; // In real app, this should be an env var

export const encryptData = (data: any) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

/**
 * VBA MACRO FOR EXCEL (Generate same encryption)
 * 
 * Sub GenerateSKLToken()
 *     ' This is a placeholder since VBA doesn't natively have AES 
 *     ' without many libraries. A simple Base64 or a simpler obfuscation 
 *     ' might be more practical for VBA, but for the web app we use AES.
 *     ' To match in VBA, one would use a DLL or a massive Class module.
 * End Sub
 */
