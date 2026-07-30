import { useCallback, useEffect, useState } from 'react'

import { deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage'

import { storage, storageRef } from './config'

export async function uploadFile(path: string, file: File | Blob): Promise<string> {
  const fileRef = storageRef(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export function isGooglePhotoUrl(url: string | null | undefined): url is string {
  return !!url && url.includes('googleusercontent.com')
}

/**
 * Espelha a foto de perfil do Google no Firebase Storage.
 * lh3.googleusercontent.com não é feito para hotlink de terceiros e
 * rate-limita (429) rajadas de requisições, ex. várias fotos numa lista de membros.
 */
export async function mirrorAvatarPhoto(uid: string, photoURL: string): Promise<string> {
  const response = await fetch(photoURL)
  const blob = await response.blob()
  return uploadFile(`avatars/${uid}_google.jpg`, blob)
}

interface IStorageProps {
  fileBlob: Blob
  fileName: string
  userId: string
  fileCategory: string
}

interface IStorage {
  loading: boolean
  transferred: number
  url: string
  setStorage(data: IStorageProps): void
  error: string | null
  deleteStorage(path: string): Promise<void>
  uploadImage(file: File, path: string): Promise<string>
}

export const useFirebaseStorage = (): IStorage => {
  const [loading, setLoading] = useState<boolean>(false)
  const [transferred, setTransferred] = useState<number>(0)
  const [url, setUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    setInitialState()
  }, [])

  const setInitialState = () => {
    setTransferred(0)
    setUrl('')
    setError(null)
  }

  const uploadImage = useCallback(async (file: File, path: string): Promise<string> => {
    try {
      return await uploadFile(path, file)
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }, [])

  const setStorage = useCallback(async ({ userId, fileBlob, fileCategory, fileName }: IStorageProps) => {
    setInitialState()
    setLoading(true)

    try {
      const url = await uploadFile(`${userId}/${fileCategory}/${fileName}`, fileBlob)
      setUrl(url)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível processar o arquivo')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteStorage = useCallback((path: string) => {
    const reference = storageRef(storage, path)
    return deleteObject(reference)
  }, [])

  return {
    loading,
    transferred,
    setStorage,
    url,
    error,
    deleteStorage,
    uploadImage,
  }
}
