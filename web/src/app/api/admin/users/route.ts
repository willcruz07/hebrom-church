import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/services/firebase/admin-config';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { email, password, role, sub_groups, ...profileData } = await request.json();

    // 1. Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: profileData.full_name,
    });

    // 2. Criar documento do usuário no Firestore
    const userData = {
      email,
      role: role || 'member',
      sub_groups: sub_groups || [],
      profile: {
        ...profileData,
        avatar_url: profileData.avatar_url || null,
        is_profile_public: profileData.is_profile_public ?? true,
      },
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid 
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Erro ao criar usuário via Admin SDK:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao criar usuário';
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
