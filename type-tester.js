
        // Global functions for handling alternates (outside of class to avoid context issues)
        function yjGetElementId(element) {
            // Create a unique ID for tracking alternates per element
            if (!element.dataset.yjElementId) {
                element.dataset.yjElementId = 'yj_' + Math.random().toString(36).substr(2, 9);
            }
            return element.dataset.yjElementId;
        }

        function yjMapSliderToWeight(sliderPosition) {
            // Map slider positions 0-4 to actual font weights
            const weightMap = [100, 300, 400, 500, 700];
            return weightMap[sliderPosition] || 400;
        }

        function yjGetWeightName(weight) {
            const weights = {
                '100': 'Thin',
                '300': 'Light', 
                '400': 'Regular',
                '500': 'Medium',
                '700': 'Bold'
            };
            return weights[weight.toString()] || 'Regular';
        }

        function yjUpdateElementAlternates(element, altType, isActive) {
            const elementId = yjGetElementId(element);
            
            // Initialize global alternates tracking if needed
            if (!window.yjActiveAlternates) {
                window.yjActiveAlternates = new Map();
            }
            
            // Initialize alternates tracking for this element if needed
            if (!window.yjActiveAlternates.has(elementId)) {
                window.yjActiveAlternates.set(elementId, new Set());
            }
            
            const alternates = window.yjActiveAlternates.get(elementId);
            
            // Update the active alternates
            if (isActive) {
                alternates.add(altType);
            } else {
                alternates.delete(altType);
            }
            
            // Build font-feature-settings string
            yjApplyAlternates(element, alternates);
        }

        function yjApplyAlternates(element, alternates) {
            // Map alternate types to OpenType features
            const featureMap = {
                'case': 'case',
                'i': 'ss01', 
                'a': 'ss02',
                'g': 'ss03',
                'yj-smile': 'ss04'
            };
            
            // Build the font-feature-settings string
            let featureSettings = [];
            
            // Always include kerning (on by default)
            featureSettings.push('"kern" 1');
            
            // Add active alternates
            alternates.forEach(altType => {
                const feature = featureMap[altType];
                if (feature) {
                    featureSettings.push(`"${feature}" 1`);
                }
            });
            
            // Apply to element
            if (featureSettings.length > 1) { // More than just kern
                element.style.fontFeatureSettings = featureSettings.join(', ');
            } else {
                element.style.fontFeatureSettings = '"kern" 1'; // Reset to just kerning
            }
        }

        // YJ Font Case Study JavaScript
        class YJFontController {
            constructor() {
                this.init();
            }

            async init() {
                this.setupSection1WeightButtons();
                this.setupSection2Alternates();
                await this.loadExternalSVG(); // Load external SVG if needed
                this.setupSection3PathSliders();
                this.setupSection4TypeTesters();
                this.setupLanguageSelectors(); // Setup language switching for testers 9, 10, 11
                this.ensureSliderConsistency(); // Ensure all sliders work properly
                this.initializeTypeTestersState(); // Set initial state for type testers
                this.initializePathSlidersState(); // Set initial state for path sliders
                this.initializeTester3AltA(); // Initialize tester3 Alt a as active
            }

            // Initialize type tester sliders to show correct state
            // JP
            initializeTypeTestersState() {
                const testerSliders = document.querySelectorAll('[data-yj-tester-slider]');
                testerSliders.forEach(slider => {
                    const testerId = slider.dataset.yjTesterSlider;
                    
                    // Find the associated tester element to read its weight class
                    const tester = document.querySelector(`[data-yj-editable="${testerId}"]`);
                    let initialWeight = 400; // default
                    
                    if (tester) {
                        // Extract weight from class name (e.g., 'yj-weight-300' -> 300)
                        const weightClass = Array.from(tester.classList).find(cls => cls.startsWith('yj-weight-'));
                        if (weightClass) {
                            initialWeight = parseInt(weightClass.replace('yj-weight-', ''), 10);
                        }
                    }
                    
                    // Convert weight to slider position (0-4)
                    let sliderPosition;
                    if (initialWeight === 100) {
                        sliderPosition = 0; // Thin
                    } else if (initialWeight === 300) {
                        sliderPosition = 1; // Light
                    } else if (initialWeight === 400) {
                        sliderPosition = 2; // Regular
                    } else if (initialWeight === 500) {
                        sliderPosition = 3; // Medium
                    } else if (initialWeight === 700) {
                        sliderPosition = 4; // Bold
                    } else {
                        sliderPosition = 2; // Default to Regular
                    }
                    
                    // Set the slider value correctly using both methods
                    slider.value = sliderPosition;
                    slider.setAttribute('value', sliderPosition);
                    
                    // Force a repaint by requesting the current value
                    void slider.offsetWidth;
                    
                    // Update the label to show correct weight name
                    const label = document.querySelector(`[data-yj-tester-weight-label="${testerId}"]`);
                    if (label) {
                        label.textContent = yjGetWeightName(initialWeight);
                    }
                    
                    // Ensure the tester has the correct weight class (should already be set in HTML)
                    if (tester) {
                        tester.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                        tester.classList.add(`yj-weight-${initialWeight}`);
                    }
                });
            }

            // Initialize path sliders to show correct initial state
            initializePathSlidersState() {
                const pathSliders = document.querySelectorAll('[data-yj-path-slider]');
                pathSliders.forEach(slider => {
                    const pathId = slider.dataset.yjPathSlider;
                    
                    // Get the slider's current value (from HTML)
                    let sliderValue = parseInt(slider.value, 10);
                    
                    // For path sliders that use position-based system (0-4), convert to weight
                    let weight;
                    if (slider.min === '0' && slider.max === '4') {
                        // Position-based slider (like path1)
                        weight = yjMapSliderToWeight(sliderValue);
                    } else {
                        // Weight-based slider (like path2, path3)
                        weight = sliderValue;
                    }
                    
                    // Update SVG stroke width for path-based SVGs
                    const svgPaths = document.querySelectorAll(`[data-yj-svg-stroke="${pathId}"]`);
                    if (svgPaths.length > 0) {
                        const strokeWidth = this.calculateStrokeWidth(weight);
                        svgPaths.forEach(path => {
                            path.style.strokeWidth = strokeWidth;
                        });
                    }
                    
                    // Update text elements
                    const pathTexts = document.querySelectorAll(`[data-yj-path-text="${pathId}"]`);
                    pathTexts.forEach(pathText => {
                        if (pathText.tagName === 'text') {
                            pathText.setAttribute('font-weight', weight);
                            pathText.setAttribute('font-variation-settings', `'wght' ${weight}`);
                        } else {
                            pathText.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                            pathText.classList.add(`yj-weight-${weight}`);
                        }
                    });
                    
                    // Update label
                    const label = slider.parentElement.querySelector('[data-yj-weight-label]');
                    if (label) {
                        label.textContent = yjGetWeightName(weight);
                    }
                });
                
                // After initializing all path sliders, update circular text for path1 and path3
                setTimeout(() => {
                    if (typeof updateAllCircles === 'function') {
                        updateAllCircles();
                    }
                    if (typeof updateAllCirclesPath3 === 'function') {
                        updateAllCirclesPath3();
                    }
                }, 10);
            }

            // Initialize tester3 Alt a as active on page load
            initializeTester3AltA() {
                const tester3Element = document.querySelector('[data-yj-editable="tester3"]');
                if (tester3Element) {
                    // Apply the Alt a alternate (ss02) to tester3
                    yjUpdateElementAlternates(tester3Element, 'a', true);
                }
            }

            // Ensure all weight sliders work consistently
            ensureSliderConsistency() {
                // Fix path sliders (Section 3) - respect existing HTML setup
                const pathSliders = document.querySelectorAll('[data-yj-path-slider]');
                pathSliders.forEach(slider => {
                    const pathId = slider.dataset.yjPathSlider;
                    
                    // path1 uses position-based system (0-4), others use weight-based (100-700)
                    if (pathId === 'path1') {
                        slider.setAttribute('min', '0');
                        slider.setAttribute('max', '4');
                        slider.setAttribute('step', '1');
                        if (!slider.value || slider.value === '') {
                            slider.value = '0'; // Default to Thin
                        }
                    } else {
                        // path2, path3, etc. use weight-based system
                        slider.setAttribute('min', '100');
                        slider.setAttribute('max', '700');
                        slider.setAttribute('step', '100');
                        if (!slider.value || slider.value === '') {
                            slider.value = '400';
                        }
                    }
                });

                // Fix type tester sliders (Section 4) - use position-based system
                const testerSliders = document.querySelectorAll('[data-yj-tester-slider]');
                testerSliders.forEach(slider => {
                    slider.setAttribute('min', '0');
                    slider.setAttribute('max', '4');
                    slider.setAttribute('step', '1');
                    // Don't reset the value here - let initializeTypeTestersState handle it
                });
            }

            // Load external SVG content
            async loadExternalSVG() {
                try {
                    // Uncomment the lines below if you want to use external SVG
                    /*
                    const response = await fetch('/img/yj-peace-svg.svg');
                    const svgText = await response.text();
                    const svgContainer = document.querySelector('[data-yj-external-svg]');
                    if (svgContainer) {
                        svgContainer.innerHTML = svgText;
                        // Add necessary classes and attributes after injection
                        const textElement = svgContainer.querySelector('text');
                        if (textElement) {
                            textElement.classList.add('yj-path-text', 'yj-weight-400');
                            textElement.setAttribute('data-yj-path-text', 'path1');
                            textElement.setAttribute('data-target-yj-section3-text1', '');
                        }
                    }
                    */
                } catch (error) {
                    console.warn('Could not load external SVG:', error);
                }
            }

            // Character set generation
            /* REMOVED JP 8 JULY
            setupCharacterSet() {
                const charset = document.querySelector('[data-yj-charset]');
                if (!charset) return;

                // Generate character set (customize as needed)
                const characters = [
                    // Uppercase
                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                    // Lowercase
                    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
                    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                    // Numbers
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    // Punctuation
                    '.', ',', '?', '!', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}',
                    '-', '–', '—', '&', '@', '#', '$', '%', '+', '=', '*', '/', '\\'
                ];

                characters.forEach(char => {
                    const span = document.createElement('span');
                    span.textContent = char;
                    charset.appendChild(span);
                });
            }/**/

            // Section 1: Weight buttons
            setupSection1WeightButtons() {
                const buttons = document.querySelectorAll('[data-yj-weight]');
                const charsets = document.querySelectorAll('[data-yj-charset]');

                buttons.forEach(button => {
                    button.addEventListener('click', () => {
                        // Remove active class from all buttons
                        buttons.forEach(btn => btn.classList.remove('active'));
                        // Add active class to clicked button
                        button.classList.add('active');

                        // Update charset weight
                        const weight = button.dataset.yjWeight;
                        const weightClasses = ['yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700'];

                        // Remove weight classes from the charset div itself
                        charsets.forEach(charset => {
                          charset.classList.remove(...weightClasses);
                          charset.classList.add(`yj-weight-${weight}`);
                        });

                        // Remove weight classes from all descendants and add the new one
                        charsets.forEach(charset => {
                          charset.querySelectorAll('*').forEach(child => {
                            child.classList.remove(...weightClasses);
                            child.classList.add(`yj-weight-${weight}`);
                          });
                        });
                    });
                });
            }

            // Section 2: Stylistic alternates
            setupSection2Alternates() {
                const toggles = document.querySelectorAll('[data-yj-alt]');

                toggles.forEach(toggle => {
                    toggle.addEventListener('click', () => {
                        const isActive = toggle.classList.contains('active');
                        toggle.classList.toggle('active');

                        const altType = toggle.dataset.yjAlt;
                        const targetLine = toggle.dataset.yjTarget;
                        const lineElement = document.querySelector(`[data-yj-line="${targetLine}"]`);

                        if (lineElement) {
                            yjUpdateElementAlternates(lineElement, altType, !isActive);
                        }
                    });
                });
            }

            // Section 3: Path sliders
            setupSection3PathSliders() {
                const sliders = document.querySelectorAll('[data-yj-path-slider]');

                sliders.forEach(slider => {
                    slider.addEventListener('input', (e) => {
                        const pathId = slider.dataset.yjPathSlider;
                        let weight;
                        
                        // Handle different slider types
                        if (pathId === 'path1') {
                            // Position-based slider (0-4)
                            const sliderPosition = parseInt(e.target.value, 10);
                            weight = yjMapSliderToWeight(sliderPosition);
                        } else {
                            // Weight-based slider (100-700)
                            const rawWeight = parseInt(e.target.value);
                            weight = this.snapToNearestWeight(rawWeight);
                            // Update slider to exact weight
                            e.target.value = weight;
                        }
                        
                        // Update text weight (handle multiple text elements with same path ID)
                        const pathTexts = document.querySelectorAll(`[data-yj-path-text="${pathId}"]`);
                        pathTexts.forEach(pathText => {
                            if (pathText) {
                                // For SVG text elements, use setAttribute instead of classes
                                if (pathText.tagName === 'text') {
                                    pathText.setAttribute('font-weight', weight);
                                    // Also update font-variation-settings for variable fonts
                                    pathText.setAttribute('font-variation-settings', `'wght' ${weight}`);
                                } else {
                                    // For regular HTML text elements, use classes
                                    pathText.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                                    pathText.classList.add(`yj-weight-${weight}`);
                                }
                            }
                        });

                        // Update SVG paths stroke width (for path-based SVGs like YJ peace sign)
                        const svgPaths = document.querySelectorAll(`[data-yj-svg-stroke="${pathId}"]`);
                        if (svgPaths.length > 0) {
                            const strokeWidth = this.calculateStrokeWidth(weight);
                            svgPaths.forEach(path => {
                                path.style.strokeWidth = strokeWidth;
                            });
                        }

                        // Update label
                        const label = slider.parentElement.querySelector('[data-yj-weight-label]');
                        if (label) {
                            label.textContent = yjGetWeightName(weight);
                        }

                        // If this is path1, also update the circular text elements
                        if (pathId === 'path1' && typeof updateAllCircles === 'function') {
                            updateAllCircles();
                        }
                    });
                });
            }

            // Section 4: Type testers
            setupSection4TypeTesters() {
                // Setup tester sliders
                const testerSliders = document.querySelectorAll('[data-yj-tester-slider]');
                testerSliders.forEach(slider => {
                    slider.addEventListener('input', (e) => {
                        const sliderPosition = parseInt(e.target.value, 10);
                        const weight = yjMapSliderToWeight(sliderPosition); // Use the global function
                        const testerId = slider.dataset.yjTesterSlider;
                        
                        // Update tester weight
                        const tester = document.querySelector(`[data-yj-editable="${testerId}"]`);
                        const label = document.querySelector(`[data-yj-tester-weight-label="${testerId}"]`);
                        
                        if (tester) {
                            // Remove all weight classes first
                            tester.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                            // Add the new weight class
                            tester.classList.add(`yj-weight-${weight}`);
                        }

                        if (label) {
                            label.textContent = yjGetWeightName(weight);
                        }
                    });
                });

                // Setup tester alternates
                const testerToggles = document.querySelectorAll('[data-yj-tester-alt]');
                testerToggles.forEach(toggle => {
                    toggle.addEventListener('click', () => {
                        const isActive = toggle.classList.contains('active');
                        toggle.classList.toggle('active');

                        const altType = toggle.dataset.yjTesterAlt;
                        const testerId = toggle.dataset.yjTesterTarget;
                        const testerElement = document.querySelector(`[data-yj-editable="${testerId}"]`);

                        if (testerElement) {
                            yjUpdateElementAlternates(testerElement, altType, !isActive);
                        }
                    });
                });
            }

            // Setup language selectors for testers 9, 10, 11
            setupLanguageSelectors() {
                // Load language data from the JSON script tag
                const languageDataElement = document.getElementById('yj-language-data');
                if (!languageDataElement) {
                    console.warn('Language data not found');
                    return;
                }

                let languageData;
                try {
                    languageData = JSON.parse(languageDataElement.textContent);
                } catch (error) {
                    console.error('Failed to parse language data:', error);
                    return;
                }

                // Setup language selectors for testers 9, 10, 11
                const languageSelectors = document.querySelectorAll('[data-yj-language-selector]');
                languageSelectors.forEach(selector => {
                    const testerId = selector.dataset.yjLanguageSelector;
                    
                    // Only handle testers 9, 10, 11
                    if (!['tester9', 'tester10', 'tester11'].includes(testerId)) {
                        return;
                    }

                    selector.addEventListener('change', (e) => {
                        const selectedLanguage = e.target.value;
                        const testerElement = document.querySelector(`[data-yj-editable="${testerId}"]`);
                        
                        if (testerElement && languageData[testerId] && languageData[testerId][selectedLanguage]) {
                            // Get the text content for the selected language
                            let newText = languageData[testerId][selectedLanguage];
                            
                            // Convert \\n to actual line breaks
                            newText = newText.replace(/\\n/g, '\n');
                            
                            // Preserve the current cursor position if possible
                            const selection = window.getSelection();
                            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                            const cursorOffset = range && range.startContainer.parentNode === testerElement ? 
                                range.startOffset : 0;
                            
                            // Update the text content
                            testerElement.textContent = newText;
                            
                            // Try to restore cursor position (simplified approach)
                            if (cursorOffset > 0 && cursorOffset <= newText.length) {
                                try {
                                    const newRange = document.createRange();
                                    const textNode = testerElement.childNodes[0];
                                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                                        newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent.length));
                                        newRange.collapse(true);
                                        selection.removeAllRanges();
                                        selection.addRange(newRange);
                                    }
                                } catch (error) {
                                    // Cursor positioning failed, but text update succeeded
                                    console.log('Could not restore cursor position');
                                }
                            }
                            
                            // Ensure the element maintains its styling and functionality
                            // The weight classes and alternates should already be applied via CSS
                            // and the existing toggle/slider functionality should continue to work
                        }
                    });
                });
            }

            // Utility functions
            snapToNearestWeight(value) {
                const availableWeights = [100, 300, 400, 500, 700];
                return availableWeights.reduce((prev, curr) => 
                    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                );
            }

            // Utility functions
            getWeightName(weight) {
                const weights = {
                    '100': 'Thin',
                    '300': 'Light',
                    '400': 'Regular',
                    '500': 'Medium',
                    '700': 'Bold'
                };
                return weights[weight] || 'Regular';
            }

            calculateStrokeWidth(weight) {
                // Get custom SVG weights from debug controls if they exist, otherwise use defaults
                const getCustomWeight = (elementId, defaultValue) => {
                    const element = document.getElementById(elementId);
                    return element ? parseFloat(element.value) : defaultValue;
                };

                const weightMap = {
                    100: getCustomWeight('svgWeightThin', 0.8),      // Thin
                    300: getCustomWeight('svgWeightLight', 1.542),   // Light  
                    400: getCustomWeight('svgWeightRegular', 2.25),  // Regular
                    500: getCustomWeight('svgWeightMedium', 3.125),  // Medium
                    700: getCustomWeight('svgWeightBold', 4.75)      // Bold
                };
                return weightMap[weight] || getCustomWeight('svgWeightRegular', 2.25);
            }
        }

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Add small delay to ensure full rendering
            setTimeout(() => {
                new YJFontController();
            }, 50);
        });

        // Add performance optimization
        const yjPerformanceOptimizer = {
            debounce: (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
        };

        // Apply debouncing to slider inputs for better performance
        document.addEventListener('DOMContentLoaded', () => {
            const sliders = document.querySelectorAll('input[type="range"]');
            sliders.forEach(slider => {
                const originalHandler = slider.oninput;
                if (originalHandler) {
                    slider.oninput = yjPerformanceOptimizer.debounce(originalHandler, 16); // ~60fps
                }
            });
        });


    // New Script added for 3 concentric circles
        function getMaxRadius() {
            const slider1 = document.getElementById('radiusSlider1');
            const slider2 = document.getElementById('radiusSlider2');
            if (!slider1 || !slider2) return 100; // default fallback
            const radius1 = parseInt(slider1.value);
            const radius2 = parseInt(slider2.value);
            return Math.max(radius1, radius2);
        }

        function updateCircleGroup(groupId, text, radius, color, fontSize, radiusValueId, circumferenceValueId, centerX, centerY, showStroke, startAngle, endAngle, isReversed = false) {
            const group = document.getElementById(groupId);
            group.innerHTML = '';
            // Draw the circle line if enabled
            if (showStroke) {
                group.innerHTML += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="blue" stroke-width="1" />`;
                // Draw start and end markers
                const markerLength = fontSize; // 20px, same as font size
                // Start marker
                const startRad = (startAngle - 90) * Math.PI / 180;
                const sx1 = centerX + radius * Math.cos(startRad);
                const sy1 = centerY + radius * Math.sin(startRad);
                const sx2 = centerX + (radius + markerLength) * Math.cos(startRad);
                const sy2 = centerY + (radius + markerLength) * Math.sin(startRad);
                group.innerHTML += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="blue" stroke-width="1" />`;
                // End marker
                const endRad = (endAngle - 90) * Math.PI / 180;
                const ex1 = centerX + radius * Math.cos(endRad);
                const ey1 = centerY + radius * Math.sin(endRad);
                const ex2 = centerX + (radius + markerLength) * Math.cos(endRad);
                const ey2 = centerY + (radius + markerLength) * Math.sin(endRad);
                group.innerHTML += `<line x1="${ex1}" y1="${ey1}" x2="${ex2}" y2="${ey2}" stroke="blue" stroke-width="1" />`;
            }
            
            let chars = text.split('');
            // Reverse the text if isReversed is true
            if (isReversed) {
                chars = chars.reverse();
            }
            
            const charCount = chars.length;
            // Calculate the angle range and step
            let angleStart = typeof startAngle === 'number' ? startAngle : 0;
            let angleEnd = typeof endAngle === 'number' ? endAngle : 360;
            if (angleEnd < angleStart) angleEnd += 360; // handle wrap-around
            const angleRange = angleEnd - angleStart;
            const angleStep = angleRange / charCount;
            
            for (let i = 0; i < charCount; i++) {
                const char = chars[i];
                const angle = (angleStart + angleStep * i - 90) * Math.PI / 180;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const rotate = angleStart + angleStep * i;
                
                // For reversed text, flip it 180 degrees so bottom text reads left to right
                const transform = isReversed ? 
                    `rotate(${rotate + 180},${x},${y})` : 
                    `rotate(${rotate},${x},${y})`;
                
                // Get current weight from the path1 slider (convert position to weight)
                const currentSlider = document.querySelector('[data-yj-path-slider="path1"]');
                let currentWeight = 400; // default
                if (currentSlider) {
                    const sliderPosition = parseInt(currentSlider.value, 10);
                    currentWeight = yjMapSliderToWeight(sliderPosition);
                }
                
                group.innerHTML += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family='YJ Dual Variable, Courier New, monospace' fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="${transform}" data-yj-path-text="path1" class="yj-path-text yj-weight-${currentWeight} yj-alt-i" font-weight="${currentWeight}" font-variation-settings="'wght' ${currentWeight}">${char}</text>`;
            }
            if (radiusValueId) document.getElementById(radiusValueId).textContent = radius;
            if (circumferenceValueId) document.getElementById(circumferenceValueId).textContent = (2 * Math.PI * radius).toFixed(2);
        }

        function updateAllCircles() {
            const svg = document.getElementById('circularSvg');
            if (!svg) return; // Exit if SVG doesn't exist
            
            const maxRadius = getMaxRadius();
            const viewBoxSize = (maxRadius * 2) + 40;
            const centerX = viewBoxSize / 2;
            const centerY = viewBoxSize / 2;
            svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);
            svg.style.width = viewBoxSize + 'px';
            svg.style.height = viewBoxSize + 'px';
            
            // First circle (normal) - check if elements exist
            const startAngle1Element = document.getElementById('startAngle1');
            const endAngle1Element = document.getElementById('endAngle1');
            const startAngleValue1Element = document.getElementById('startAngleValue1');
            const endAngleValue1Element = document.getElementById('endAngleValue1');
            
            if (!startAngle1Element || !endAngle1Element) return; // Exit if required elements don't exist
            
            const startAngle1 = parseInt(startAngle1Element.value);
            const endAngle1 = parseInt(endAngle1Element.value);
            if (startAngleValue1Element) startAngleValue1Element.textContent = startAngle1;
            if (endAngleValue1Element) endAngleValue1Element.textContent = endAngle1;
            const textInput1 = document.getElementById('textInput1');
            const radiusSlider1 = document.getElementById('radiusSlider1');
            const showStroke1 = document.getElementById('showStroke1');
            
            if (textInput1 && radiusSlider1 && showStroke1) {
                updateCircleGroup(
                    'circleGroup1',
                    textInput1.value,
                    parseInt(radiusSlider1.value),
                    '#0009F9',
                    20,
                    'radiusValue1',
                    'circumferenceValue1',
                    centerX,
                    centerY,
                    showStroke1.checked,
                    startAngle1,
                    endAngle1,
                    false // not reversed
                );
            }
            
            // Second circle (reversed and flipped) - independent radius
            const startAngle2Element = document.getElementById('startAngle2');
            const endAngle2Element = document.getElementById('endAngle2');
            const startAngleValue2Element = document.getElementById('startAngleValue2');
            const endAngleValue2Element = document.getElementById('endAngleValue2');
            const textInput2 = document.getElementById('textInput2');
            const radiusSlider2 = document.getElementById('radiusSlider2');
            const showStroke2 = document.getElementById('showStroke2');
            
            if (startAngle2Element && endAngle2Element && textInput2 && radiusSlider2 && showStroke2) {
                const startAngle2 = parseInt(startAngle2Element.value);
                const endAngle2 = parseInt(endAngle2Element.value);
                if (startAngleValue2Element) startAngleValue2Element.textContent = startAngle2;
                if (endAngleValue2Element) endAngleValue2Element.textContent = endAngle2;
                
                updateCircleGroup(
                    'circleGroup2',
                    textInput2.value,
                    parseInt(radiusSlider2.value), // INDEPENDENT radius
                    '#0009F9', // Second (bottom) text string text color
                    20,
                    'radiusValue2', // radius display for second circle
                    'circumferenceValue2', // circumference display for second circle
                    centerX, // SAME center as first circle
                    centerY, // SAME center as first circle
                    showStroke2.checked, // show stroke for second circle
                    startAngle2,
                    endAngle2,
                    true // reversed
                );
            }
        }

        // Initialize after a short delay to ensure DOM is ready
        setTimeout(function() {
            const textInput1 = document.getElementById('textInput1');
            const radiusSlider1 = document.getElementById('radiusSlider1');
            const showStroke1 = document.getElementById('showStroke1');
            const startAngle1 = document.getElementById('startAngle1');
            const endAngle1 = document.getElementById('endAngle1');
            
            const textInput2 = document.getElementById('textInput2');
            const radiusSlider2 = document.getElementById('radiusSlider2');
            const showStroke2 = document.getElementById('showStroke2');
            const startAngle2 = document.getElementById('startAngle2');
            const endAngle2 = document.getElementById('endAngle2');
            
            // SVG weight input fields
            const svgWeightThin = document.getElementById('svgWeightThin');
            const svgWeightLight = document.getElementById('svgWeightLight');
            const svgWeightRegular = document.getElementById('svgWeightRegular');
            const svgWeightMedium = document.getElementById('svgWeightMedium');
            const svgWeightBold = document.getElementById('svgWeightBold');
            
            if (textInput1) textInput1.addEventListener('input', updateAllCircles);
            if (radiusSlider1) radiusSlider1.addEventListener('input', updateAllCircles);
            if (showStroke1) showStroke1.addEventListener('change', updateAllCircles);
            if (startAngle1) startAngle1.addEventListener('input', updateAllCircles);
            if (endAngle1) endAngle1.addEventListener('input', updateAllCircles);
            
            if (textInput2) textInput2.addEventListener('input', updateAllCircles);
            if (radiusSlider2) radiusSlider2.addEventListener('input', updateAllCircles);
            if (showStroke2) showStroke2.addEventListener('change', updateAllCircles);
            if (startAngle2) startAngle2.addEventListener('input', updateAllCircles);
            if (endAngle2) endAngle2.addEventListener('input', updateAllCircles);
            
            // Add event listeners for SVG weight inputs to update stroke width immediately
            const updateSVGStroke = () => {
                // Get current weight from path1 slider
                const currentSlider = document.querySelector('[data-yj-path-slider="path1"]');
                if (currentSlider) {
                    const sliderPosition = parseInt(currentSlider.value, 10);
                    const weight = yjMapSliderToWeight(sliderPosition);
                    
                    // Create a temporary YJFontController instance to access calculateStrokeWidth
                    const tempController = new YJFontController();
                    const strokeWidth = tempController.calculateStrokeWidth(weight);
                    
                    // Update all SVG paths with path1 data attribute
                    const svgPaths = document.querySelectorAll('[data-yj-svg-stroke="path1"]');
                    svgPaths.forEach(path => {
                        path.style.strokeWidth = strokeWidth;
                    });
                }
            };
            
            if (svgWeightThin) svgWeightThin.addEventListener('input', updateSVGStroke);
            if (svgWeightLight) svgWeightLight.addEventListener('input', updateSVGStroke);
            if (svgWeightRegular) svgWeightRegular.addEventListener('input', updateSVGStroke);
            if (svgWeightMedium) svgWeightMedium.addEventListener('input', updateSVGStroke);
            if (svgWeightBold) svgWeightBold.addEventListener('input', updateSVGStroke);
            
            updateAllCircles();
        }, 100);

        // Handle main debug toggle (if it exists)
        const mainDebugToggle = document.getElementById('mainDebugToggle');
        if (mainDebugToggle) {
            mainDebugToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const debugControls = document.querySelector('.debug-controls');
                if (debugControls) {
                    debugControls.classList.toggle('debug-hidden');
                    const linkText = debugControls.classList.contains('debug-hidden') ? 'Show Debug' : 'Hide Debug';
                    this.textContent = linkText;
                }
            });
        }

        // Handle close button (if it exists)
        const closeDebugControls = document.getElementById('closeDebugControls');
        if (closeDebugControls) {
            closeDebugControls.addEventListener('click', function(e) {
                e.preventDefault();
                const debugControls = document.querySelector('.debug-controls');
                const mainDebugToggle = document.getElementById('mainDebugToggle');
                if (debugControls) {
                    debugControls.classList.add('debug-hidden');
                }
                if (mainDebugToggle) {
                    mainDebugToggle.textContent = 'Show Debug';
                }
            });
        }

        
        // Path2 Three Concentric Circles Functions (completely separate from path1)
        function getMaxRadiusPath2() {
            // Get the actual radius values from the debug controls
            const radius1 = parseInt(document.getElementById('radiusSlider1Path2').value) || 130;
            const radius2 = parseInt(document.getElementById('radiusSlider2Path2').value) || 90;
            const radius3 = parseInt(document.getElementById('radiusSlider3Path2').value) || 50;
            return Math.max(radius1, radius2, radius3);
        }

        function updateCircleGroupPath2(groupId, text, radius, color, fontSize, radiusValueId, circumferenceValueId, centerX, centerY, showStroke = false) {
            const group = document.getElementById(groupId);
            if (!group) return;
            
            group.innerHTML = showStroke ? `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="blue" stroke-width="1" />` : '';
            const chars = text.split('');
            const charCount = chars.length;
            const angleStep = 360 / charCount;
            
            // Get current weight from the path2 slider
            const currentSlider = document.querySelector('[data-yj-path-slider="path2"]');
            const currentWeight = currentSlider ? currentSlider.value : 400;
            
            for (let i = 0; i < charCount; i++) {
                const char = chars[i];
                const angle = (angleStep * i - 90) * Math.PI / 180;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const rotate = angleStep * i;
                group.innerHTML += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family='YJ Dual Variable, Courier New, monospace' fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate},${x},${y})" data-yj-path-text="path2" class="yj-path-text yj-weight-${currentWeight}" font-weight="${currentWeight}" font-variation-settings="'wght' ${currentWeight}">${char}</text>`;
            }
            
            // Update the debug display values
            if (radiusValueId) {
                const radiusDisplay = document.getElementById(radiusValueId);
                if (radiusDisplay) radiusDisplay.textContent = radius;
            }
            if (circumferenceValueId) {
                const circumferenceDisplay = document.getElementById(circumferenceValueId);
                if (circumferenceDisplay) circumferenceDisplay.textContent = (2 * Math.PI * radius).toFixed(2);
            }
        }

        function updateAllCirclesPath2() {
            const maxRadius = getMaxRadiusPath2();
            const viewBoxSize = (maxRadius * 2) + 40;
            const centerX = viewBoxSize / 2;
            const centerY = viewBoxSize / 2;
            
            // Use the specific path2 SVG ID
            const svg = document.getElementById('circularSvgPath2');
            
            if (!svg) return;
            
            svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);
            svg.style.width = viewBoxSize + 'px';
            svg.style.height = viewBoxSize + 'px';
            
            // Create three concentric circles using actual debug control values
            updateCircleGroupPath2(
                'circleGroup1Path2', 
                document.getElementById('textInput1Path2').value,
                parseInt(document.getElementById('radiusSlider1Path2').value),
                '#0009F9',
                18,
                'radiusValue1Path2',
                'circumferenceValue1Path2',
                centerX,
                centerY,
                document.getElementById('showStroke1Path2').checked
            );
            
            updateCircleGroupPath2(
                'circleGroup2Path2', 
                document.getElementById('textInput2Path2').value,
                parseInt(document.getElementById('radiusSlider2Path2').value),
                '#0009F9',
                16,
                'radiusValue2Path2',
                'circumferenceValue2Path2',
                centerX,
                centerY,
                document.getElementById('showStroke2Path2').checked
            );
            
            updateCircleGroupPath2(
                'circleGroup3Path2', 
                document.getElementById('textInput3Path2').value,
                parseInt(document.getElementById('radiusSlider3Path2').value),
                '#0009F9',
                14,
                'radiusValue3Path2',
                'circumferenceValue3Path2',
                centerX,
                centerY,
                document.getElementById('showStroke3Path2').checked
            );
        }

        // Initialize path2 circles after DOM is ready
        setTimeout(function() {
            // Set up debug controls event listeners
            const textInput1Path2 = document.getElementById('textInput1Path2');
            const radiusSlider1Path2 = document.getElementById('radiusSlider1Path2');
            const showStroke1Path2 = document.getElementById('showStroke1Path2');
            const textInput2Path2 = document.getElementById('textInput2Path2');
            const radiusSlider2Path2 = document.getElementById('radiusSlider2Path2');
            const showStroke2Path2 = document.getElementById('showStroke2Path2');
            const textInput3Path2 = document.getElementById('textInput3Path2');
            const radiusSlider3Path2 = document.getElementById('radiusSlider3Path2');
            const showStroke3Path2 = document.getElementById('showStroke3Path2');
            
            // Add event listeners for all debug controls
            if (textInput1Path2) textInput1Path2.addEventListener('input', updateAllCirclesPath2);
            if (radiusSlider1Path2) radiusSlider1Path2.addEventListener('input', updateAllCirclesPath2);
            if (showStroke1Path2) showStroke1Path2.addEventListener('change', updateAllCirclesPath2);
            if (textInput2Path2) textInput2Path2.addEventListener('input', updateAllCirclesPath2);
            if (radiusSlider2Path2) radiusSlider2Path2.addEventListener('input', updateAllCirclesPath2);
            if (showStroke2Path2) showStroke2Path2.addEventListener('change', updateAllCirclesPath2);
            if (textInput3Path2) textInput3Path2.addEventListener('input', updateAllCirclesPath2);
            if (radiusSlider3Path2) radiusSlider3Path2.addEventListener('input', updateAllCirclesPath2);
            if (showStroke3Path2) showStroke3Path2.addEventListener('change', updateAllCirclesPath2);
            
            // Listen for path2 weight slider changes to update the text
            const path2Slider = document.querySelector('[data-yj-path-slider="path2"]');
            if (path2Slider) {
                path2Slider.addEventListener('input', function() {
                    // Small delay to ensure weight classes are updated first
                    setTimeout(updateAllCirclesPath2, 10);
                });
            }
            
            // Set up debug toggle functionality
            const debugToggle = document.getElementById('debugTogglePath2');
            const debugControls = document.getElementById('debugControlsPath2');
            const closeBtn = document.getElementById('closeDebugControlsPath2');
            
            if (debugToggle && debugControls) {
                debugToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    debugControls.classList.toggle('debug-hidden');
                    const linkText = debugControls.classList.contains('debug-hidden') ? 'Show Debug' : 'Hide Debug';
                    this.textContent = linkText;
                });
            }
            
            if (closeBtn && debugControls && debugToggle) {
                closeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    debugControls.classList.add('debug-hidden');
                    debugToggle.textContent = 'Show Debug';
                });
            }
            
            // Initialize the circles
            updateAllCirclesPath2();
                 }, 200);

        // Path3 JavaScript (duplicate of Path1 with Path3 IDs)
        function getMaxRadiusPath3() {
            const radius1 = parseInt(document.getElementById('radiusSlider1Path3').value);
            const radius2 = parseInt(document.getElementById('radiusSlider2Path3').value);
            return Math.max(radius1, radius2);
        }

        function updateCircleGroupPath3(groupId, text, radius, color, fontSize, radiusValueId, circumferenceValueId, centerX, centerY, showStroke, startAngle, endAngle, isReversed = false) {
            const group = document.getElementById(groupId);
            if (!group) return;
            
            group.innerHTML = '';
            
            // Draw the circle line if enabled
            if (showStroke) {
                group.innerHTML += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="blue" stroke-width="1" />`;
                // Draw start and end markers
                const markerLength = fontSize; // 20px, same as font size
                // Start marker
                const startRad = (startAngle - 90) * Math.PI / 180;
                const sx1 = centerX + radius * Math.cos(startRad);
                const sy1 = centerY + radius * Math.sin(startRad);
                const sx2 = centerX + (radius + markerLength) * Math.cos(startRad);
                const sy2 = centerY + (radius + markerLength) * Math.sin(startRad);
                group.innerHTML += `<line x1="${sx1}" y1="${sy1}" x2="${sx2}" y2="${sy2}" stroke="blue" stroke-width="1" />`;
                // End marker
                const endRad = (endAngle - 90) * Math.PI / 180;
                const ex1 = centerX + radius * Math.cos(endRad);
                const ey1 = centerY + radius * Math.sin(endRad);
                const ex2 = centerX + (radius + markerLength) * Math.cos(endRad);
                const ey2 = centerY + (radius + markerLength) * Math.sin(endRad);
                group.innerHTML += `<line x1="${ex1}" y1="${ey1}" x2="${ex2}" y2="${ey2}" stroke="blue" stroke-width="1" />`;
            }
            
            let chars = text.split('');
            // Reverse the text if isReversed is true
            if (isReversed) {
                chars = chars.reverse();
            }
            
            const charCount = chars.length;
            // Calculate the angle range and step
            let angleStart = typeof startAngle === 'number' ? startAngle : 0;
            let angleEnd = typeof endAngle === 'number' ? endAngle : 360;
            if (angleEnd < angleStart) angleEnd += 360; // handle wrap-around
            const angleRange = angleEnd - angleStart;
            const angleStep = angleRange / charCount;
            
            for (let i = 0; i < charCount; i++) {
                const char = chars[i];
                const angle = (angleStart + angleStep * i - 90) * Math.PI / 180;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                const rotate = angleStart + angleStep * i;
                
                // For reversed text, flip it 180 degrees so bottom text reads left to right
                const transform = isReversed ? 
                    `rotate(${rotate + 180},${x},${y})` : 
                    `rotate(${rotate},${x},${y})`;
                
                // Get current weight from the path3 slider
                const currentSlider = document.querySelector('[data-yj-path-slider="path3"]');
                const currentWeight = currentSlider ? currentSlider.value : 700;
                
                group.innerHTML += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family='YJ Dual Variable, Courier New, monospace' fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="${transform}" data-yj-path-text="path3" class="yj-path-text yj-weight-${currentWeight}" font-weight="${currentWeight}" font-variation-settings="'wght' ${currentWeight}">${char}</text>`;
            }
            
            if (radiusValueId) document.getElementById(radiusValueId).textContent = radius;
            if (circumferenceValueId) document.getElementById(circumferenceValueId).textContent = (2 * Math.PI * radius).toFixed(2);
        }

        function updateAllCirclesPath3() {
            const maxRadius = getMaxRadiusPath3();
            const viewBoxSize = (maxRadius * 2) + 40;
            const centerX = viewBoxSize / 2;
            const centerY = viewBoxSize / 2;
            const svg = document.getElementById('circularSvgPath3');
            
            if (!svg) return;
            
            svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);
            svg.style.width = viewBoxSize + 'px';
            svg.style.height = viewBoxSize + 'px';
            
            // Update the centered text with current weight and content (4 lines)
            const currentSlider = document.querySelector('[data-yj-path-slider="path3"]');
            const currentWeight = currentSlider ? currentSlider.value : 700;
            
            // Define line spacing and starting position for 4 lines
            const lineHeight = 42; // pixels between lines
            const totalHeight = lineHeight * 3; // 3 gaps between 4 lines
            const startY = centerY - (totalHeight / 2); // start position to center the block
            
            // Update all 4 center text lines
            for (let i = 1; i <= 4; i++) {
                const centerText = document.getElementById(`centerText${i}Path3`);
                const centerTextInput = document.getElementById(`centerTextInput${i}Path3`);
                
                if (centerText) {
                    const centerTextContent = centerTextInput ? centerTextInput.value : '';
                    // Add extra spacing for the 4th line only
                    const extraSpacing = (i === 4) ? 10 : 0;
                    const yPosition = startY + ((i - 1) * lineHeight) + extraSpacing;
                    
                    // Update center text position to match the dynamic center
                    centerText.setAttribute('x', centerX);
                    centerText.setAttribute('y', yPosition);
                    centerText.setAttribute('font-weight', currentWeight);
                    centerText.setAttribute('font-variation-settings', `'wght' ${currentWeight}`);
                    centerText.textContent = centerTextContent;
                    centerText.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                    centerText.classList.add(`yj-weight-${currentWeight}`);
                }
            }
            
            // First circle (normal)
            const startAngle1 = parseInt(document.getElementById('startAngle1Path3').value);
            const endAngle1 = parseInt(document.getElementById('endAngle1Path3').value);
            document.getElementById('startAngleValue1Path3').textContent = startAngle1;
            document.getElementById('endAngleValue1Path3').textContent = endAngle1;
            updateCircleGroupPath3(
                'circleGroup1Path3',
                document.getElementById('textInput1Path3').value,
                parseInt(document.getElementById('radiusSlider1Path3').value),
                '#0009F9',
                20,
                'radiusValue1Path3',
                'circumferenceValue1Path3',
                centerX,
                centerY,
                document.getElementById('showStroke1Path3').checked,
                startAngle1,
                endAngle1,
                false // not reversed
            );
            
            // Second circle (reversed and flipped) - independent radius
            const startAngle2 = parseInt(document.getElementById('startAngle2Path3').value);
            const endAngle2 = parseInt(document.getElementById('endAngle2Path3').value);
            document.getElementById('startAngleValue2Path3').textContent = startAngle2;
            document.getElementById('endAngleValue2Path3').textContent = endAngle2;
            updateCircleGroupPath3(
                'circleGroup2Path3',
                document.getElementById('textInput2Path3').value,
                parseInt(document.getElementById('radiusSlider2Path3').value),
                '#0009F9',
                20,
                'radiusValue2Path3',
                'circumferenceValue2Path3',
                centerX,
                centerY,
                document.getElementById('showStroke2Path3').checked,
                startAngle2,
                endAngle2,
                true // reversed
            );
        }

        // Initialize Path3 after a short delay to ensure DOM is ready
        setTimeout(function() {
            const centerTextInput1Path3 = document.getElementById('centerTextInput1Path3');
            const centerTextInput2Path3 = document.getElementById('centerTextInput2Path3');
            const centerTextInput3Path3 = document.getElementById('centerTextInput3Path3');
            const centerTextInput4Path3 = document.getElementById('centerTextInput4Path3');
            const textInput1Path3 = document.getElementById('textInput1Path3');
            const radiusSlider1Path3 = document.getElementById('radiusSlider1Path3');
            const showStroke1Path3 = document.getElementById('showStroke1Path3');
            const startAngle1Path3 = document.getElementById('startAngle1Path3');
            const endAngle1Path3 = document.getElementById('endAngle1Path3');
            
            const textInput2Path3 = document.getElementById('textInput2Path3');
            const radiusSlider2Path3 = document.getElementById('radiusSlider2Path3');
            const showStroke2Path3 = document.getElementById('showStroke2Path3');
            const startAngle2Path3 = document.getElementById('startAngle2Path3');
            const endAngle2Path3 = document.getElementById('endAngle2Path3');
            
            // Center text input listeners (4 lines)
            if (centerTextInput1Path3) centerTextInput1Path3.addEventListener('input', updateAllCirclesPath3);
            if (centerTextInput2Path3) centerTextInput2Path3.addEventListener('input', updateAllCirclesPath3);
            if (centerTextInput3Path3) centerTextInput3Path3.addEventListener('input', updateAllCirclesPath3);
            if (centerTextInput4Path3) centerTextInput4Path3.addEventListener('input', updateAllCirclesPath3);
            
            if (textInput1Path3) textInput1Path3.addEventListener('input', updateAllCirclesPath3);
            if (radiusSlider1Path3) radiusSlider1Path3.addEventListener('input', updateAllCirclesPath3);
            if (showStroke1Path3) showStroke1Path3.addEventListener('change', updateAllCirclesPath3);
            if (startAngle1Path3) startAngle1Path3.addEventListener('input', updateAllCirclesPath3);
            if (endAngle1Path3) endAngle1Path3.addEventListener('input', updateAllCirclesPath3);
            
            if (textInput2Path3) textInput2Path3.addEventListener('input', updateAllCirclesPath3);
            if (radiusSlider2Path3) radiusSlider2Path3.addEventListener('input', updateAllCirclesPath3);
            if (showStroke2Path3) showStroke2Path3.addEventListener('change', updateAllCirclesPath3);
            if (startAngle2Path3) startAngle2Path3.addEventListener('input', updateAllCirclesPath3);
            if (endAngle2Path3) endAngle2Path3.addEventListener('input', updateAllCirclesPath3);
            
            // Listen for path3 weight slider changes
            const path3Slider = document.querySelector('[data-yj-path-slider="path3"]');
            if (path3Slider) {
                path3Slider.addEventListener('input', function() {
                    setTimeout(updateAllCirclesPath3, 10);
                });
            }
            
            // Handle debug toggle for Path3
            const debugTogglePath3 = document.getElementById('debugTogglePath3');
            const debugControlsPath3 = document.getElementById('debugControlsPath3');
            const closeDebugControlsPath3 = document.getElementById('closeDebugControlsPath3');
            
            if (debugTogglePath3 && debugControlsPath3) {
                debugTogglePath3.addEventListener('click', function(e) {
                    e.preventDefault();
                    debugControlsPath3.classList.toggle('debug-hidden');
                    const linkText = debugControlsPath3.classList.contains('debug-hidden') ? 'Show Debug' : 'Hide Debug';
                    this.textContent = linkText;
                });
            }
            
            if (closeDebugControlsPath3 && debugControlsPath3 && debugTogglePath3) {
                closeDebugControlsPath3.addEventListener('click', function(e) {
                    e.preventDefault();
                    debugControlsPath3.classList.add('debug-hidden');
                    debugTogglePath3.textContent = 'Show Debug';
                });
            }
            
            updateAllCirclesPath3();
        }, 300);

        // Drag functionality for debug controls
        function makeDraggable(element) {
            if (!element) return;
            
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;
            
            // Get initial position from CSS
            const rect = element.getBoundingClientRect();
            xOffset = rect.left;
            yOffset = rect.top;
            
            function dragStart(e) {
                // Only start drag if clicking on the header or the main debug controls area (not inputs)
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') {
                    return;
                }
                
                if (e.type === "touchstart") {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                } else {
                    initialX = e.clientX - xOffset;
                    initialY = e.clientY - yOffset;
                }
                
                if (e.target === element || e.target.closest('.debug-controls-header')) {
                    isDragging = true;
                    element.style.transition = 'none'; // Disable transitions during drag
                }
            }
            
            function dragEnd(e) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                element.style.transition = ''; // Re-enable transitions
            }
            
            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    
                    if (e.type === "touchmove") {
                        currentX = e.touches[0].clientX - initialX;
                        currentY = e.touches[0].clientY - initialY;
                    } else {
                        currentX = e.clientX - initialX;
                        currentY = e.clientY - initialY;
                    }
                    
                    xOffset = currentX;
                    yOffset = currentY;
                    
                    // Constrain to viewport
                    const maxX = window.innerWidth - element.offsetWidth;
                    const maxY = window.innerHeight - element.offsetHeight;
                    
                    currentX = Math.max(0, Math.min(currentX, maxX));
                    currentY = Math.max(0, Math.min(currentY, maxY));
                    
                    element.style.left = currentX + "px";
                    element.style.top = currentY + "px";
                    element.style.right = "auto"; // Override right positioning
                }
            }
            
            // Add event listeners
            element.addEventListener("mousedown", dragStart);
            element.addEventListener("touchstart", dragStart);
            
            document.addEventListener("mousemove", drag);
            document.addEventListener("touchmove", drag);
            
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("touchend", dragEnd);
        }
        
        // Initialize drag functionality for all debug controls
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                // Make main debug controls draggable
                const mainDebugControls = document.querySelector('.debug-controls');
                if (mainDebugControls) {
                    makeDraggable(mainDebugControls);
                }
                
                // Make path2 debug controls draggable
                const path2DebugControls = document.getElementById('debugControlsPath2');
                if (path2DebugControls) {
                    makeDraggable(path2DebugControls);
                }
                
                // Make path3 debug controls draggable
                const path3DebugControls = document.getElementById('debugControlsPath3');
                if (path3DebugControls) {
                    makeDraggable(path3DebugControls);
                }
            }, 150);
        });

        console.log("✅ type-tester.js loaded from jsDelivr - v5 - 21 September 2025");
