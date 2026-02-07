/**
 * ImageUploadModal - Modal para upload e preview de imagens
 *
 * Funcionalidades:
 * - Upload de imagem via input file
 * - Preview da imagem selecionada
 * - Opção de remover imagem
 * - Suporte para diferentes aspect ratios (capa 16:9, logo 1:1)
 * - Compressão automática de imagens
 * - Limite de 10MB
 */

import React, { useState, useRef } from 'react';
import { Icon } from '@/components/Icon';
import { compressImage } from '@/lib/image';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string | null) => Promise<void>;
  title: string;
  currentImage?: string;
  aspectRatio?: 'cover' | 'square'; // cover = 16:9, square = 1:1
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  currentImage,
  aspectRatio = 'cover',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert('A imagem deve ter no máximo 10MB');
        return;
      }

      setLoading(true);
      try {
        // Define dimensões baseadas no aspect ratio
        const maxWidth = aspectRatio === 'cover' ? 1920 : 800;
        const maxHeight = aspectRatio === 'cover' ? 1080 : 800;

        const compressedBase64 = await compressImage(file, maxWidth, maxHeight);
        setPreviewUrl(compressedBase64);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(previewUrl);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      alert('Erro ao salvar imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(currentImage || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
      <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div
            className={`relative bg-slate-800 rounded-lg overflow-hidden border-2 border-dashed border-slate-700 ${aspectRatio === 'cover' ? 'aspect-video' : 'aspect-square'
              }`}
          >
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mb-2"></div>
                <p className="text-sm">Processando imagem...</p>
              </div>
            ) : previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Icon name="image" className="w-12 h-12 mb-2" />
                <p className="text-sm">Nenhuma imagem selecionada</p>
              </div>
            )}
          </div>

          {/* File Input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSelectImage}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icon name="upload" className="w-5 h-5" />
              {previewUrl ? 'Alterar Imagem' : 'Selecionar Imagem'}
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Formatos aceitos: JPG, PNG, GIF</p>
            <p>• Tamanho máximo: 10MB</p>
            {aspectRatio === 'cover' && <p>• Recomendado: 1920x1080 ou similar (16:9)</p>}
            {aspectRatio === 'square' && <p>• Recomendado: 500x500 ou similar (1:1)</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-slate-800">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 font-medium hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${loading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};