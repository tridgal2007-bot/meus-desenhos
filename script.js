// Navbar Logic
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        navbar.classList.add('bg-storm-dark/90', 'border-storm-dark', 'backdrop-blur-md');
        navbar.classList.remove('border-transparent');
    } else {
        navbar.classList.remove('bg-storm-dark/90', 'border-storm-dark', 'backdrop-blur-md');
        navbar.classList.add('border-transparent');
    }
});

// Mobile Menu Toggle
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('opacity-100');
        if (isOpen) {
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        } else {
            mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        }
    });
}

// Close mobile menu on link click
if (mobileLinks) {
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        });
    });
}


// VFX: Rain and Lightning
const rainCanvas = document.getElementById('rain-canvas');
const lightningCanvas = document.getElementById('lightning-canvas');
const flashOverlay = document.getElementById('lightning-flash-overlay');

if (rainCanvas && lightningCanvas) {
    const ctxRain = rainCanvas.getContext('2d');
    const ctxLightning = lightningCanvas.getContext('2d');

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
        w = window.innerWidth;
        h = window.innerHeight;
        rainCanvas.width = w;
        rainCanvas.height = h;
        lightningCanvas.width = w;
        lightningCanvas.height = h;
    };
    window.addEventListener('resize', resize);
    resize();

    // Rain Logic
    const raindrops = [];
    const maxDrops = 150;

    for (let i = 0; i < maxDrops; i++) {
        raindrops.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: Math.random() * 15 + 10,
            len: Math.random() * 20 + 10,
        });
    }

    function drawRain() {
        ctxRain.clearRect(0, 0, w, h);
        ctxRain.strokeStyle = 'rgba(174, 194, 224, 0.3)';
        ctxRain.lineWidth = 1;
        ctxRain.lineCap = 'round';

        ctxRain.beginPath();
        for (let i = 0; i < maxDrops; i++) {
            const d = raindrops[i];
            ctxRain.moveTo(d.x, d.y);
            ctxRain.lineTo(d.x, d.y + d.len);

            d.y += d.speed;
            d.x -= 1; // Slight wind

            if (d.y > h) {
                d.y = -20;
                d.x = Math.random() * w;
            }
        }
        ctxRain.stroke();
        requestAnimationFrame(drawRain);
    }
    drawRain();

    // Lightning Logic
    let isFlashing = false;

    function flash() {
        if (isFlashing) return;
        isFlashing = true;

        // Flash Overlay
        flashOverlay.style.opacity = (Math.random() * 0.3 + 0.1).toString();
        setTimeout(() => {
            flashOverlay.style.opacity = '0';
        }, 100);

        // Draw Lightning Bolt
        const startX = Math.random() * w;
        
        ctxLightning.strokeStyle = '#ffffff';
        ctxLightning.shadowBlur = 20;
        ctxLightning.shadowColor = '#818cf8';
        ctxLightning.lineWidth = 2;
        
        ctxLightning.beginPath();
        ctxLightning.moveTo(startX, 0);
        
        let currentX = startX;
        let currentY = 0;
        
        while (currentY < h) {
            const newX = currentX + (Math.random() * 40 - 20);
            const newY = currentY + (Math.random() * 30 + 10);
            ctxLightning.lineTo(newX, newY);
            currentX = newX;
            currentY = newY;
        }
        ctxLightning.stroke();

        // Clear lightning
        setTimeout(() => {
            ctxLightning.clearRect(0, 0, w, h);
            isFlashing = false;
            scheduleFlash();
        }, 150);
    }

    function scheduleFlash() {
        const delay = Math.random() * 5000 + 2000;
        setTimeout(flash, delay);
    }
    scheduleFlash();
}

// ----------------------------------------------------
// QUIRK SYSTEM LOGIC (Classes.html)
// ----------------------------------------------------
const quirksData = [
    {
        id: 'one-for-all',
        name: 'STRENGTH ENHANCER',
        desc: 'Acumule poder bruto para liberar ataques devastadores. Aumenta drasticamente a força física e a agilidade.',
        rarity: 'MÍTICO',
        color: 'text-yellow-400',
        borderColor: 'border-yellow-400',
        imageUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjJ4b2J6YWR6czB4ZGJ4ZGJ4ZGJ4ZGJ4ZGJ4ZGJ4ZGJ4ZGJ4/3oKIPqZPlKW5otXIS4/giphy.gif' 
    },
    {
        id: 'explosion',
        name: 'EXPLOSION',
        desc: 'Permite que o usuário secrete nitroglicerina através do suor das mãos e a detone à vontade para criar explosões.',
        rarity: 'LENDÁRIO',
        color: 'text-orange-500',
        borderColor: 'border-orange-500',
        imageUrl: 'https://media.giphy.com/media/12p5byldHRgyu4/giphy.gif'
    },
    {
        id: 'half-cold',
        name: 'HALF-COLD HALF-HOT',
        desc: 'Gera gelo pelo lado direito do corpo e fogo pelo lado esquerdo. Controle de temperatura perfeito.',
        rarity: 'LENDÁRIO',
        color: 'text-red-400',
        borderColor: 'border-red-400',
        imageUrl: 'https://media.giphy.com/media/3o7TKrEzvJbsQNqJxu/giphy.gif'
    },
    {
        id: 'gravity',
        name: 'ZERO GRAVITY',
        desc: 'Remove a gravidade de qualquer coisa que toca com as pontas dos dedos. Permite flutuar objetos ou a si mesmo.',
        rarity: 'RARO',
        color: 'text-pink-400',
        borderColor: 'border-pink-400',
        imageUrl: 'https://media.giphy.com/media/xT9DPBM9tXlWc/giphy.gif'
    },
    {
        id: 'engine',
        name: 'ENGINE',
        desc: 'Motores nas panturrilhas concedem velocidade incrível e chutes superpotentes.',
        rarity: 'COMUM',
        color: 'text-blue-400',
        borderColor: 'border-blue-400',
        imageUrl: 'https://media.giphy.com/media/26AHG5KGFxSkQLBcm/giphy.gif'
    },
    {
        id: 'electric',
        name: 'ELECTRIFICATION',
        desc: 'Permite descarregar eletricidade do corpo. Uso excessivo causa "curto-circuito" no cérebro.',
        rarity: 'RARO',
        color: 'text-yellow-300',
        borderColor: 'border-yellow-300',
        imageUrl: 'https://media.giphy.com/media/exOfV2Qo8v5F6/giphy.gif'
    },
    {
        id: 'shadow',
        name: 'DARK SHADOW',
        desc: 'Manifesta uma sombra senciente que pode atacar ou defender. Mais forte no escuro, mas difícil de controlar.',
        rarity: 'ÉPICO',
        color: 'text-purple-500',
        borderColor: 'border-purple-500',
        imageUrl: 'https://media.giphy.com/media/11jGtzDu7Nh89a/giphy.gif'
    }
];

const classButtonsContainer = document.getElementById('class-buttons');
const classTitle = document.getElementById('class-title');
const classDesc = document.getElementById('class-desc');
const classImage = document.getElementById('class-image');
const rarityBadge = document.getElementById('rarity-badge');

if (classButtonsContainer) {
    // 1. Render Buttons
    quirksData.forEach((quirk, index) => {
        const btn = document.createElement('div');
        btn.className = `cursor-pointer group relative p-4 bg-black border-l-4 ${quirk.borderColor} border-y border-r border-white/10 hover:bg-white/5 transition-all`;
        btn.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-comic text-xl text-white tracking-wide group-hover:translate-x-2 transition-transform">${quirk.name}</span>
                <i data-lucide="chevron-right" class="w-5 h-5 ${quirk.color} opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        `;
        
        btn.onclick = () => selectQuirk(quirk);
        classButtonsContainer.appendChild(btn);

        // Load Lucide icons for the newly created buttons
        if (window.lucide) window.lucide.createIcons();
    });

    // 2. Selection Function
    function selectQuirk(quirk) {
        // Update Content
        classTitle.innerText = quirk.name;
        classTitle.className = `font-comic text-3xl md:text-5xl mb-2 md:mb-4 italic uppercase leading-none drop-shadow-[2px_2px_0px_#000] ${quirk.color}`;
        
        classDesc.innerText = quirk.desc;
        classDesc.style.borderColor = quirk.color.replace('text-', ''); // Rough approximation for border color logic or just use CSS classes

        // Update Rarity Badge
        rarityBadge.innerHTML = `
            <i data-lucide="star" class="w-4 h-4 ${quirk.color} fill-current"></i>
            <span class="font-tech font-bold text-sm tracking-widest text-white uppercase">${quirk.rarity}</span>
        `;
        
        // Refresh icons in the badge
        if (window.lucide) window.lucide.createIcons();

        // Update Image with Fade Effect
        classImage.style.opacity = '0';
        setTimeout(() => {
            // In a real scenario, use actual quirk images. Using colored placeholders or generic gifs here.
            classImage.src = quirk.imageUrl || 'https://via.placeholder.com/600x400/000000/FFFFFF/?text=' + quirk.name;
            classImage.onload = () => {
                classImage.style.opacity = '0.8';
            };
        }, 200);
    }

    // Select first one by default
    if (quirksData.length > 0) {
        selectQuirk(quirksData[0]);
    }
}