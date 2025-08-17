
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
                this.ensureSliderConsistency(); // Ensure all sliders work properly
                this.initializeTypeTestersState(); // Set initial state for type testers
            }

            // Initialize type tester sliders to show correct state
            initializeTypeTestersState() {
                const testerSliders = document.querySelectorAll('[data-yj-tester-slider]');
                testerSliders.forEach(slider => {
                    const testerId = slider.dataset.yjTesterSlider;
                    
                    // Find the associated tester element to read its initial weight class
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
                    const weightToPosition = {
                        100: 0, // Thin
                        300: 1, // Light
                        400: 2, // Regular
                        500: 3, // Medium
                        700: 4  // Bold
                    };
                    
                    const sliderPosition = weightToPosition[initialWeight] || 2;
                    slider.value = sliderPosition;
                    
                    // Update the label to show correct weight name
                    const label = document.querySelector(`[data-yj-tester-weight-label="${testerId}"]`);
                    if (label) {
                        label.textContent = yjGetWeightName(initialWeight);
                    }
                    
                    // Ensure the tester has the correct weight class (should already be set in HTML, but just in case)
                    if (tester) {
                        tester.classList.remove('yj-weight-100', 'yj-weight-300', 'yj-weight-400', 'yj-weight-500', 'yj-weight-700');
                        tester.classList.add(`yj-weight-${initialWeight}`);
                    }
                });
            }
            // Ensure all weight sliders work consistently
            ensureSliderConsistency() {
                // Fix path sliders (Section 3)
                const pathSliders = document.querySelectorAll('[data-yj-path-slider]');
                pathSliders.forEach(slider => {
                    slider.setAttribute('min', '100');
                    slider.setAttribute('max', '700');
                    slider.setAttribute('step', '100');
                    if (!slider.value || slider.value === '') {
                        slider.value = '400';
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
                        const rawWeight = parseInt(e.target.value);
                        const weight = this.snapToNearestWeight(rawWeight);
                        
                        // Update slider to exact weight
                        e.target.value = weight;
                        
                        const pathId = slider.dataset.yjPathSlider;
                        
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
                // Map font weight to SVG stroke width for YJ Dual Variable with decimal precision
                const weightMap = {
                    100: 0.8,      // Thin
                    300: 1.542,    // Light  
                    400: 2.25,     // Regular
                    500: 3.125,    // Medium
                    700: 4.75      // Bold
                };
                return weightMap[weight] || 2.25;
            }
        }

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new YJFontController();
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
            const radius1 = parseInt(document.getElementById('radiusSlider1').value);
            const radius2 = parseInt(document.getElementById('radiusSlider2').value);
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
                
                // Get current weight from the path1 slider
                const currentSlider = document.querySelector('[data-yj-path-slider="path1"]');
                const currentWeight = currentSlider ? currentSlider.value : 400;
                
                group.innerHTML += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family='YJ Dual Variable, Courier New, monospace' fill="${color}" text-anchor="middle" dominant-baseline="middle" transform="${transform}" data-yj-path-text="path1" class="yj-path-text yj-weight-${currentWeight}" font-weight="${currentWeight}" font-variation-settings="'wght' ${currentWeight}">${char}</text>`;
            }
            if (radiusValueId) document.getElementById(radiusValueId).textContent = radius;
            if (circumferenceValueId) document.getElementById(circumferenceValueId).textContent = (2 * Math.PI * radius).toFixed(2);
        }

        function updateAllCircles() {
            const maxRadius = getMaxRadius();
            const viewBoxSize = (maxRadius * 2) + 40;
            const centerX = viewBoxSize / 2;
            const centerY = viewBoxSize / 2;
            const svg = document.getElementById('circularSvg');
            svg.setAttribute('viewBox', `0 0 ${viewBoxSize} ${viewBoxSize}`);
            svg.style.width = viewBoxSize + 'px';
            svg.style.height = viewBoxSize + 'px';
            
            // First circle (normal)
            const startAngle1 = parseInt(document.getElementById('startAngle1').value);
            const endAngle1 = parseInt(document.getElementById('endAngle1').value);
            document.getElementById('startAngleValue1').textContent = startAngle1;
            document.getElementById('endAngleValue1').textContent = endAngle1;
            updateCircleGroup(
                'circleGroup1',
                document.getElementById('textInput1').value,
                parseInt(document.getElementById('radiusSlider1').value),
                '#0009F9',
                20,
                'radiusValue1',
                'circumferenceValue1',
                centerX,
                centerY,
                document.getElementById('showStroke1').checked,
                startAngle1,
                endAngle1,
                false // not reversed
            );
            
            // Second circle (reversed and flipped) - independent radius
            const startAngle2 = parseInt(document.getElementById('startAngle2').value);
            const endAngle2 = parseInt(document.getElementById('endAngle2').value);
            document.getElementById('startAngleValue2').textContent = startAngle2;
            document.getElementById('endAngleValue2').textContent = endAngle2;
            updateCircleGroup(
                'circleGroup2',
                document.getElementById('textInput2').value,
                parseInt(document.getElementById('radiusSlider2').value), // INDEPENDENT radius
                '#0009F9', // Second (bottom) text string text color
                20,
                'radiusValue2', // radius display for second circle
                'circumferenceValue2', // circumference display for second circle
                centerX, // SAME center as first circle
                centerY, // SAME center as first circle
                document.getElementById('showStroke2').checked, // show stroke for second circle
                startAngle2,
                endAngle2,
                true // reversed
            );
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
            
            updateAllCircles();
        }, 100);

        // Handle main debug toggle
        document.getElementById('mainDebugToggle').addEventListener('click', function(e) {
            e.preventDefault();
            const debugControls = document.querySelector('.debug-controls');
            debugControls.classList.toggle('debug-hidden');
            const linkText = debugControls.classList.contains('debug-hidden') ? 'Show Debug' : 'Hide Debug';
            this.textContent = linkText;
        });

        // Handle close button
        document.getElementById('closeDebugControls').addEventListener('click', function(e) {
            e.preventDefault();
            const debugControls = document.querySelector('.debug-controls');
            debugControls.classList.add('debug-hidden');
            document.getElementById('mainDebugToggle').textContent = 'Show Debug';
        });

        
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
            const lineHeight = 40; // pixels between lines
            const totalHeight = lineHeight * 3; // 3 gaps between 4 lines
            const startY = centerY - (totalHeight / 2); // start position to center the block
            
            // Update all 4 center text lines
            for (let i = 1; i <= 4; i++) {
                const centerText = document.getElementById(`centerText${i}Path3`);
                const centerTextInput = document.getElementById(`centerTextInput${i}Path3`);
                
                if (centerText) {
                    const centerTextContent = centerTextInput ? centerTextInput.value : '';
                    const yPosition = startY + ((i - 1) * lineHeight);
                    
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

        console.log("✅ type-tester.js loaded from jsDelivr");