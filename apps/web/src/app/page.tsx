export default function Page() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <h1 style={{ fontSize: '64px', margin: 0 }}>CampusEat!</h1>
      <p style={{ fontSize: '20px', marginTop: '20px', lineHeight: '1.5', maxWidth: '600px' }}>
        대학생을 위한 종합 캠퍼스 플랫폼!<br />
        (맛집 추천, 번개 모임, 학식/셔틀, 커뮤니티)
      </p>
    </div>
  );
}
