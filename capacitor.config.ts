// Vercel 빌드 설정과 일치시키기 위해 webDir을 'public'으로 수정했습니다.
const config = {
  appId: 'dev.aistudio.dungeon',
  appName: '지식의 던전',
  webDir: 'public', // 'www'에서 'public'으로 변경하여 빌드 오류를 해결합니다.
  server: {
    androidScheme: 'https'
  }
};

export default config;
