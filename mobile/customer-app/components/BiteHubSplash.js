"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiteHubSplash = BiteHubSplash;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const floatingFoods = ["🍕", "🍟", "🍱", "🌮", "🍜", "🥗", "🍗", "🧁"];
function BiteHubSplash({ accentColor = "#cc0000", label = "BiteHub", logoSource, subtitle = "Flavour, delivered fast." }) {
    const logoScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0.3)).current;
    const logoOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    const ringScale = (0, react_1.useRef)(new react_native_1.Animated.Value(0.9)).current;
    const ringOpacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0.24)).current;
    const dotValues = (0, react_1.useMemo)(() => [new react_native_1.Animated.Value(0.45), new react_native_1.Animated.Value(0.65), new react_native_1.Animated.Value(0.85)], []);
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.parallel([
            react_native_1.Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 620,
                easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                useNativeDriver: true
            }),
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(logoScale, {
                    toValue: 1.04,
                    duration: 760,
                    easing: react_native_1.Easing.out(react_native_1.Easing.back(1.6)),
                    useNativeDriver: true
                }),
                react_native_1.Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 260,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                    useNativeDriver: true
                })
            ])
        ]).start();
        const ringLoop = react_native_1.Animated.loop(react_native_1.Animated.parallel([
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(ringScale, {
                    toValue: 1.16,
                    duration: 2000,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: true
                }),
                react_native_1.Animated.timing(ringScale, {
                    toValue: 0.9,
                    duration: 10,
                    useNativeDriver: true
                })
            ]),
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(ringOpacity, {
                    toValue: 0,
                    duration: 2000,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: true
                }),
                react_native_1.Animated.timing(ringOpacity, {
                    toValue: 0.24,
                    duration: 10,
                    useNativeDriver: true
                })
            ])
        ]));
        const dotLoops = dotValues.map((value, index) => react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.delay(index * 160),
            react_native_1.Animated.timing(value, {
                toValue: 0.9,
                duration: 420,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true
            }),
            react_native_1.Animated.timing(value, {
                toValue: 0.45,
                duration: 420,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true
            })
        ])));
        ringLoop.start();
        dotLoops.forEach((loop) => loop.start());
        return () => {
            ringLoop.stop();
            dotLoops.forEach((loop) => loop.stop());
        };
    }, [dotValues, logoOpacity, logoScale, ringOpacity, ringScale]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.screen, children: [floatingFoods.map((food, index) => ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.food,
                    {
                        left: `${8 + ((index * 13) % 74)}%`,
                        top: `${7 + ((index * 11) % 78)}%`,
                        opacity: 0.08 + (index % 3) * 0.02,
                        transform: [{ rotate: `${index % 2 === 0 ? -8 : 6}deg` }]
                    }
                ], children: food }, `${food}-${index}`))), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                    styles.pulseRing,
                    {
                        borderColor: "rgba(255,255,255,0.2)",
                        opacity: ringOpacity,
                        transform: [{ scale: ringScale }]
                    }
                ] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                    styles.pulseRing,
                    styles.pulseRingSoft,
                    {
                        borderColor: "rgba(255,255,255,0.1)",
                        opacity: ringOpacity.interpolate({
                            inputRange: [0, 0.24],
                            outputRange: [0, 0.18]
                        }),
                        transform: [
                            {
                                scale: ringScale.interpolate({
                                    inputRange: [0.9, 1.16],
                                    outputRange: [1, 1.28]
                                })
                            }
                        ]
                    }
                ] }), (0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                    styles.logoShell,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }]
                    }
                ], children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: logoSource, style: styles.logo, resizeMode: "contain" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.brandLabel, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.subtitle, children: subtitle }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.dots, children: dotValues.map((value, index) => ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                        styles.dot,
                        {
                            backgroundColor: accentColor,
                            opacity: value,
                            transform: [
                                {
                                    scaleY: value.interpolate({
                                        inputRange: [0.45, 1],
                                        outputRange: [0.72, 1.18]
                                    })
                                }
                            ]
                        }
                    ] }, `dot-${index}`))) })] }));
}
const styles = react_native_1.StyleSheet.create({
    screen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#040000"
    },
    food: {
        position: "absolute",
        fontSize: 24
    },
    redGlow: {
        position: "absolute",
        width: 224,
        height: 224,
        borderRadius: 112
    },
    pulseRing: {
        position: "absolute",
        width: 224,
        height: 224,
        borderRadius: 112,
        borderWidth: 2
    },
    pulseRingSoft: {
        width: 244,
        height: 244,
        borderRadius: 122
    },
    logoShell: {
        width: 224,
        height: 224,
        borderRadius: 112,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        shadowColor: "#000000",
        shadowOpacity: 0.32,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10
    },
    logo: {
        width: 206,
        height: 206
    },
    brandLabel: {
        marginTop: 28,
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 0.6
    },
    subtitle: {
        marginTop: 10,
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 3
    },
    dots: {
        flexDirection: "row",
        gap: 10,
        marginTop: 34
    },
    dot: {
        width: 7,
        height: 20,
        borderRadius: 999
    }
});
