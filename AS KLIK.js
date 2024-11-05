// ==UserScript==
// @name         Blum clicker msl
// @version      2.7
// @namespace    Violentmonkey Scripts
// @author       mudachyo
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Blum
// ==/UserScript==

let GAME_SETTINGS = {
	minBombHits: Math.floor(Math.random() * 2),
	minIceHits: Math.floor(Math.random() * 2) + 2,
	flowerSkipPercentage: Math.floor(Math.random() * 11) + 15,
	minDelayMs: 500,
	maxDelayMs: 999,
	autoClickPlay: false,
	dogsProbability: (98 + Math.random()) / 100,
	trumpProbability: (98 + Math.random()) / 100,
	harrisProbability: (98 + Math.random()) / 100
};


let isGamePaused = false;

try {
	let gameStats = {
		score: 0,
		bombHits: 0,
		iceHits: 0,
		dogsHits: 0,
		trumpHits: 0,
		harrisHits: 0,
		flowersSkipped: 0,
		isGameOver: false,
	};

	const originalArrayPush = Array.prototype.push;
	Array.prototype.push = function(...items) {
		items.forEach(item => handleGameElement(item));
		return originalArrayPush.apply(this, items);
	};

	function handleGameElement(item) {
		if (!item || !item.asset) return;

		const {
			assetType
		} = item.asset;
		switch (assetType) {
			case "CLOVER":
				processFlower(item);
				break;
			case "BOMB":
				processBomb(item);
				break;
			case "FREEZE":
				processIce(item);
				break;
			case "DOGS":
				processDogs(item);
				break;
			case "TRUMP":
				processTrump(item);
				break;
			case "HARRIS":
				processHarris(item);
				break;
		}
	}

	function processFlower(item) {
		const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
		if (shouldSkip) {
			gameStats.flowersSkipped++;
		} else {
			gameStats.score++;
			clickElement(item);
		}
	}

	function processBomb(item) {
		if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
			gameStats.score = 0;
			clickElement(item);
			gameStats.bombHits++;
		}
	}

	function processIce(item) {
		if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
			clickElement(item);
			gameStats.iceHits++;
		}
	}

	function processDogs(item) {
		if (Math.random() < GAME_SETTINGS.dogsProbability) {
			clickElement(item);
			gameStats.dogsHits++;
		}
	}

	function processTrump(item) {
		if (Math.random() < GAME_SETTINGS.trumpProbability) {
			clickElement(item);
			gameStats.trumpHits++;
		}
	}

	function processHarris(item) {
		if (Math.random() < GAME_SETTINGS.harrisProbability) {
			clickElement(item);
			gameStats.harrisHits++;
		}
	}

	function clickElement(item) {
		if (isGamePaused) return;
		const createEvent = (type, EventClass) => new EventClass(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			isPrimary: true,
			pressure: type === 'pointerdown' ? 0.5 : 0
		});

		setTimeout(() => {
			if (typeof item.onClick === 'function') {
				if (item.element) {
					['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
						item.element.dispatchEvent(createEvent(type, type.startsWith('pointer') ? PointerEvent : MouseEvent));
					});
				}
				item.onClick(item);
			}

			item.isExplosion = true;
			item.addedAt = performance.now();
		}, getClickDelay());
	}

	// Функция для расчета задержки между кликами
	function getClickDelay() {
		const minDelay = GAME_SETTINGS.minDelayMs || 500;
		const maxDelay = GAME_SETTINGS.maxDelayMs || 1000;
		return Math.random() * (maxDelay - minDelay) + minDelay;
	}

	function checkGameCompletion() {
		const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
		if (rewardElement && !gameStats.isGameOver) {
			gameStats.isGameOver = true;
			resetGameStats();
		}
	}

	function resetGameStats() {
		gameStats = {
			score: 0,
			bombHits: 0,
			iceHits: 0,
			dogsHits: 0,
			flowersSkipped: 0,
			isGameOver: false,
		};
	}

	function getNewGameDelay() {
		return Math.floor(Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs + 1) + GAME_SETTINGS.minDelayMs);
	}
	function checkAndClickPlayButton() {
		const playButtons = document.querySelectorAll('button.kit-button.is-large.is-primary, a.play-btn[href="/game"], button.kit-button.is-large.is-primary');

		playButtons.forEach(button => {
			if (!isGamePaused && GAME_SETTINGS.autoClickPlay && button.textContent.trim().length > 0) {
				setTimeout(() => {
					gameStats.isGameOver = true;
					resetGameStats();
					button.click();
				}, getNewGameDelay());
			}
		});
	}

	function checkAndClickResetButton() {
		const errorPage = document.querySelector('div[data-v-26af7de6].error.page.wrapper');
		if (errorPage) {
			const resetButton = errorPage.querySelector('button.reset');
			if (resetButton) {
				resetButton.click();
			}
		}
	}

	function continuousErrorCheck() {
		checkAndClickResetButton();
		const delay = Math.floor(Math.random() * 1000) + 2000;
		setTimeout(continuousErrorCheck, delay);
	}

	continuousErrorCheck();

	function continuousPlayButtonCheck() {
		checkAndClickPlayButton();
		setTimeout(continuousPlayButtonCheck, 1000);
	}

	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				checkGameCompletion();
			}
		}
	});

	const appElement = document.querySelector('#app');
	if (appElement) {
		observer.observe(appElement, {
			childList: true,
			subtree: true
		});
	}

	continuousPlayButtonCheck();

	const settingsMenu = document.createElement('div');
	settingsMenu.className = 'settings-menu';
	settingsMenu.style.display = 'none';

	const menuTitle = document.createElement('h3');
	menuTitle.className = 'settings-title';
	menuTitle.textContent = 'AS KLIK';

	const closeButton = document.createElement('button');
	closeButton.className = 'settings-close-button';
	closeButton.textContent = '×';
	closeButton.onclick = () => {
		settingsMenu.style.display = 'none';
	};

	menuTitle.appendChild(closeButton);
	settingsMenu.appendChild(menuTitle);

	function updateSettingsMenu() {
		document.getElementById('flowerSkipPercentage').value = GAME_SETTINGS.flowerSkipPercentage;
		document.getElementById('flowerSkipPercentageDisplay').textContent = GAME_SETTINGS.flowerSkipPercentage;
		document.getElementById('minIceHits').value = GAME_SETTINGS.minIceHits;
		document.getElementById('minIceHitsDisplay').textContent = GAME_SETTINGS.minIceHits;
		document.getElementById('minBombHits').value = GAME_SETTINGS.minBombHits;
		document.getElementById('minBombHitsDisplay').textContent = GAME_SETTINGS.minBombHits;
		document.getElementById('minDelayMs').value = GAME_SETTINGS.minDelayMs;
		document.getElementById('minDelayMsDisplay').textContent = GAME_SETTINGS.minDelayMs;
		document.getElementById('maxDelayMs').value = GAME_SETTINGS.maxDelayMs;
		document.getElementById('maxDelayMsDisplay').textContent = GAME_SETTINGS.maxDelayMs;
		document.getElementById('autoClickPlay').checked = GAME_SETTINGS.autoClickPlay;
	}

	settingsMenu.appendChild(createSettingElement('Bunganya (%)', 'flowerSkipPercentage', 'range', 0, 100, 1,
		'EN: Persentase kemungkinan lewatin bunga.<br>' +
		'RU: Probabilitas kehilangan bunga sebagai persentase.'));
	settingsMenu.appendChild(createSettingElement('Saljunya', 'minIceHits', 'range', 1, 10, 1,
		'EN: Jumlah Minimal mencet salju.<br>' +
		'RU: Минимальное количество кликов на заморозку.'));
	settingsMenu.appendChild(createSettingElement('Bomnya', 'minBombHits', 'range', 0, 10, 1,
		'EN: Jumlah Minimal mencet bom.<br>' +
		'RU: Минимальное количество кликов на бомбу.'));
	settingsMenu.appendChild(createSettingElement('Min Delay (milidetik)', 'minDelayMs', 'range', 10, 10000, 10,
		'EN: Penundaan minimal antara klik.<br>' +
		'RU: Минимальная задержка между кликами.'));
	settingsMenu.appendChild(createSettingElement('Max Delay (milidetik)', 'maxDelayMs', 'range', 10, 10000, 10,
		'EN: Penundaan maksimal antara klik.<br>' +
		'RU: Максимальная задержка между кликами.'));
	settingsMenu.appendChild(createSettingElement('Mulai Otomatis', 'autoClickPlay', 'checkbox', null, null, null,
		'EN: Mulai lagi otomatis pas udah selesai.<br>' +
		'RU: Автоматически начинать следующую игру по окончании.'));

	const pauseResumeButton = document.createElement('button');
	pauseResumeButton.textContent = 'Pause';
	pauseResumeButton.className = 'pause-resume-btn';
	pauseResumeButton.onclick = toggleGamePause;
	settingsMenu.appendChild(pauseResumeButton);

	const socialButtons = document.createElement('div');
	socialButtons.className = 'social-buttons';

	const githubButton = document.createElement('a');
	githubButton.href = 'https://www.instagram.com/adol.saputra';
	githubButton.target = '_blank';
	githubButton.className = 'social-button';
	githubButton.innerHTML = '<img src="data:image/png;base64,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">MY INSTAGRAM';
	socialButtons.appendChild(githubButton);

	const telegramButton = document.createElement('a');
	telegramButton.href = 'https://t.me/adolsaputra';
	telegramButton.target = '_blank';
	telegramButton.className = 'social-button';
	telegramButton.innerHTML = '<img src="data:image/png;base64,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">MY TELEGRAM';
	socialButtons.appendChild(telegramButton);

	const donateButton = document.createElement('a');
	donateButton.href = 'https://www.paypal.me/MAMANGHAMZAH';
	donateButton.target = '_blank';
	donateButton.className = 'social-button';
	donateButton.innerHTML = '<img src="data:image/png;base64,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">SEDEKAH';
	socialButtons.appendChild(donateButton);

	settingsMenu.appendChild(socialButtons);

	document.body.appendChild(settingsMenu);

	const settingsButton = document.createElement('button');
	settingsButton.className = 'settings-button';
	settingsButton.textContent = '⚙️';
	settingsButton.onclick = () => {
		settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
	};
	document.body.appendChild(settingsButton);

	const style = document.createElement('style');
	style.textContent = `
    .settings-menu {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(40, 44, 52, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      color: #abb2bf;
      font-family: 'Arial', sans-serif;
      z-index: 10000;
      padding: 20px;
      width: 300px;
    }
    .settings-title {
      color: #61afef;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .settings-close-button {
      background: none;
      border: none;
      color: #e06c75;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
    }
    .setting-item {
      margin-bottom: 12px;
    }
    .setting-label {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .setting-label-text {
      color: #ff8d00;
      margin-right: 5px;
    }
    .help-icon {
      cursor: help;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #61afef;
      color: #282c34;
      font-size: 10px;
      font-weight: bold;
    }
    .setting-input {
      display: flex;
      align-items: center;
    }
    .setting-slider {
      flex-grow: 1;
      margin-right: 8px;
    }
    .setting-value {
      min-width: 30px;
      text-align: right;
      font-size: 11px;
    }
    .tooltip {
      position: relative;
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 200px;
      background-color: #4b5263;
      color: #fff;
      text-align: center;
      border-radius: 6px;
      padding: 5px;
      position: absolute;
      z-index: 1;
      bottom: 125%;
      left: 50%;
      margin-left: -100px;
      opacity: 0;
      transition: opacity 0.3s;
      font-size: 11px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .tooltip:hover .tooltiptext {
      visibility: visible;
      opacity: 1;
    }
    .pause-resume-btn {
      display: block;
      width: calc(100% - 10px);
      padding: 8px;
      margin: 15px 5px;
      background-color: #98c379;
      color: #282c34;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .pause-resume-btn:hover {
      background-color: #7cb668;
    }
    .social-buttons {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      white-space: nowrap;
    }
    .social-button {
      display: inline-flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      background-color: #282c34;
      color: #abb2bf;
      text-decoration: none;
      font-size: 12px;
      transition: background-color 0.3s;
    }
    .social-button:hover {
      background-color: #4b5263;
    }
    .social-button img {
      width: 16px;
      height: 16px;
      margin-right: 5px;
    }
    .settings-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: rgba(36, 146, 255, 0.8);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 18px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 9999;
    }
  `;
	document.head.appendChild(style);

	function createSettingElement(label, id, type, min, max, step, tooltipText) {
		const container = document.createElement('div');
		container.className = 'setting-item';

		const labelContainer = document.createElement('div');
		labelContainer.className = 'setting-label';

		const labelElement = document.createElement('span');
		labelElement.className = 'setting-label-text';
		labelElement.textContent = label;

		const helpIcon = document.createElement('span');
		helpIcon.textContent = '?';
		helpIcon.className = 'help-icon tooltip';

		const tooltipSpan = document.createElement('span');
		tooltipSpan.className = 'tooltiptext';
		tooltipSpan.innerHTML = tooltipText;
		helpIcon.appendChild(tooltipSpan);

		labelContainer.appendChild(labelElement);
		labelContainer.appendChild(helpIcon);

		const inputContainer = document.createElement('div');
		inputContainer.className = 'setting-input';

		function AutoClaimAndStart() {
			setInterval(() => {
				const claimButton = document.querySelector('button.kit-button.is-large.is-drop.is-fill.button.is-done');
				const startFarmingButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.button');
				const continueButton = document.querySelector('button.kit-button.is-large.is-primary.is-fill.btn');
				if (claimButton) {
					claimButton.click();
				} else if (startFarmingButton) {
					startFarmingButton.click();
				} else if (continueButton) {
					continueButton.click();
				}
			}, Math.floor(Math.random() * 5000) + 5000);
		}

		AutoClaimAndStart();

		let input;
		if (type === 'checkbox') {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.id = id;
			input.checked = GAME_SETTINGS[id];
			input.addEventListener('change', (e) => {
				GAME_SETTINGS[id] = e.target.checked;
				saveSettings();
			});
			inputContainer.appendChild(input);
		} else {
			input = document.createElement('input');
			input.type = type;
			input.id = id;
			input.min = min;
			input.max = max;
			input.step = step;
			input.value = GAME_SETTINGS[id];
			input.className = 'setting-slider';

			const valueDisplay = document.createElement('span');
			valueDisplay.id = `${id}Display`;
			valueDisplay.textContent = GAME_SETTINGS[id];
			valueDisplay.className = 'setting-value';

			input.addEventListener('input', (e) => {
				GAME_SETTINGS[id] = parseFloat(e.target.value);
				valueDisplay.textContent = e.target.value;
				saveSettings();
			});

			inputContainer.appendChild(input);
			inputContainer.appendChild(valueDisplay);
		}

		container.appendChild(labelContainer);
		container.appendChild(inputContainer);
		return container;
	}

	function saveSettings() {
		localStorage.setItem('BlumAutoclickerSettings', JSON.stringify(GAME_SETTINGS));
	}

	function loadSettings() {
		const savedSettings = localStorage.getItem('BlumAutoclickerSettings');
		if (savedSettings) {
			const parsedSettings = JSON.parse(savedSettings);
			GAME_SETTINGS = {
				...GAME_SETTINGS,
				...parsedSettings
			};
		}
	}

	loadSettings();
	updateSettingsMenu();

	function toggleGamePause() {
		isGamePaused = !isGamePaused;
		pauseResumeButton.textContent = isGamePaused ? 'LANJUT' : 'JEDA';
		pauseResumeButton.style.backgroundColor = isGamePaused ? '#ff8d00' : '#a56632';
	}
} catch (e) {
	console.error("AS KLIK EROR:", e);
}