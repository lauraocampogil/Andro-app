import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: readonly [string, string, ...string[]];
};

export function GradientText({ children, style, colors = ['#FFFFFF', '#8A87FF'] }: Props) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}