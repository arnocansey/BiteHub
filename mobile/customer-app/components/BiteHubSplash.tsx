import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View
} from "react-native";

type BiteHubSplashProps = {
  accentColor?: string;
  label?: string;
  logoSource: ImageSourcePropType;
  subtitle?: string;
};

const floatingFoods = ["🍕", "🍟", "🍱", "🌮", "🍜", "🥗", "🍗", "🧁"];

export function BiteHubSplash({
  accentColor = "#cc0000",
  label = "BiteHub",
  logoSource,
  subtitle = "Flavour, delivered fast."
}: BiteHubSplashProps) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.9)).current;
  const ringOpacity = useRef(new Animated.Value(0.24)).current;
  const dotValues = useMemo(
    () => [new Animated.Value(0.45), new Animated.Value(0.65), new Animated.Value(0.85)],
    []
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
          duration: 620,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.04,
          duration: 760,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 260,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ]).start();

    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.16,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(ringScale, {
            toValue: 0.9,
            duration: 10,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.24,
            duration: 10,
            useNativeDriver: true
          })
        ])
      ])
    );

    const dotLoops = dotValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, {
            toValue: 0.9,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(value, {
            toValue: 0.45,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      )
    );

    ringLoop.start();
    dotLoops.forEach((loop) => loop.start());

    return () => {
      ringLoop.stop();
      dotLoops.forEach((loop) => loop.stop());
    };
  }, [dotValues, logoOpacity, logoScale, ringOpacity, ringScale]);

  return (
    <View style={styles.screen}>
      {floatingFoods.map((food, index) => (
        <Text
          key={`${food}-${index}`}
          style={[
            styles.food,
            {
              left: `${8 + ((index * 13) % 74)}%`,
              top: `${7 + ((index * 11) % 78)}%`,
              opacity: 0.08 + (index % 3) * 0.02,
              transform: [{ rotate: `${index % 2 === 0 ? -8 : 6}deg` }]
            }
          ]}
        >
          {food}
        </Text>
      ))}

      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: "rgba(255,255,255,0.2)",
            opacity: ringOpacity,
            transform: [{ scale: ringScale }]
          }
        ]}
      />
      <Animated.View
        style={[
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
        ]}
      />

      <Animated.View
        style={[
          styles.logoShell,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]}
      >
        <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Text style={styles.brandLabel}>{label}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.dots}>
        {dotValues.map((value, index) => (
          <Animated.View
            key={`dot-${index}`}
            style={[
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
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
