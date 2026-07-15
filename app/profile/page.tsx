import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  // Find user and their interview results
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      interviewResults: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const results = user?.interviewResults || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'var(--font-inter), sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 20px 40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-outfit)', marginBottom: '10px' }}>
          Your <span style={{ color: '#ff5500' }}>Interview History</span>
        </h1>
        <p style={{ color: '#888', marginBottom: '40px' }}>Review your past performances and track your improvement over time.</p>

        {results.length === 0 ? (
          <div style={{ 
            background: '#111116', border: '1px solid #2a2a35', borderRadius: '12px', 
            padding: '40px', textAlign: 'center', color: '#888' 
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>You haven't completed any interviews yet.</p>
            <a href="/#interview" style={{ 
              display: 'inline-block', background: '#ff5500', color: '#000', 
              padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' 
            }}>
              Start an Interview
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {results.map((result) => (
              <div key={result.id} style={{ 
                background: '#0a0a0f', border: '1px solid #2a2a35', borderRadius: '12px', 
                padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>
                    {result.companyMode === 'General' ? 'General Interview' : `${(result.companyMode || '').toUpperCase()} Mock Interview`}
                  </h3>
                  <div style={{ color: '#888', fontSize: '0.9rem' }}>
                    {new Date(result.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Grade</div>
                    <div style={{ 
                      fontSize: '1.1rem', fontWeight: 'bold', 
                      color: result.overallGrade === 'Excellent' ? '#10b981' : 
                             result.overallGrade === 'Good' ? '#3b82f6' : 
                             result.overallGrade === 'Average' ? '#f59e0b' : '#ef4444' 
                    }}>
                      {result.overallGrade}
                    </div>
                  </div>
                  
                  <div style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    background: 'rgba(255,85,0,0.1)', border: '2px solid rgba(255,85,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ff5500', fontSize: '1.2rem', fontWeight: 'bold'
                  }}>
                    {result.overallScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
