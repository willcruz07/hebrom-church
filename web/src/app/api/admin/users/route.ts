import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/services/firebase/admin-config';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, phone, baptism_date, birth_date } = body;

    // 1. Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: full_name,
    });

    // 2. Criar documento do usuário no Firestore
    const userData = {
      email,
      role: role || 'member',
      sub_groups: [],
      profile: {
        full_name,
        avatar_url: null,
        bio: '',
        birth_date: birth_date || '',
        baptism_date: baptism_date || null,
        phone: phone || '',
        address: '',
        is_profile_public: true,
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
