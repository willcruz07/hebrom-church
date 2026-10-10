'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import getCroppedImg from '@/lib/cropImage'
import type { ImageSpec } from '@/lib/image-specs'

interface ImageCropperProps {
  image: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedBlob: Blob) => void
  /** Proporção e tamanho final do recorte. Sem isso, recorte quadrado na resolução original (foto de perfil). */
  spec?: ImageSpec
  title?: string
}

export function ImageCropper({
  image,
  open,
  onOpenChange,
  onCropComplete,
  spec,
  title = 'Recortar Foto',
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteCallback = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(
        image,
        croppedAreaPixels,
        0,
        undefined,
        spec ? { width: spec.width, height: spec.height } : undefined,
      )
      if (croppedBlob) {
        onCropComplete(croppedBlob)
        onOpenChange(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          {spec && (
            <p className="text-xs text-slate-500">
              Arraste e use o zoom para enquadrar. Tamanho final:{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">{spec.label}</span>
            </p>
          )}
        </DialogHeader>
        
        <div className="relative h-[400px] w-full bg-slate-100 dark:bg-slate-800">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={spec?.aspect ?? 1}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Zoom
            </label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:bg-slate-700"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirmar Corte
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
