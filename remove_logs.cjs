const fs = require('fs');
const path = require('path');

const files = [
    'src/store/notifications.store.ts',
    'src/services/onboarding.service.ts',
    'src/lib/firebase-app-check.ts',
    'src/hooks/useFCM.ts',
    'src/hooks/useAuth.ts',
    'src/firebase.ts',
    'src/features/public-shop/components/LocationModal.tsx',
    'src/features/profile/pages/ProfilePage.tsx',
    'src/features/auth/pages/LoginPage.tsx',
    'src/firebase-messaging-sw.tpl.js'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.split('\n').filter(line => !line.includes('console.log')).join('\n');
        fs.writeFileSync(filePath, content);
        console.log(`Removed logs from: ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
