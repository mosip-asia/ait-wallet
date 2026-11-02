import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Header} from '../components/ui/Header';
import {RootRouteProps} from '../routes';
import {HomeScreen} from './Home/HomeScreen';
import {IssuersScreen} from './Issuers/IssuersScreen';
import {palette, spacing} from '../ait/theme/tokens';

const {Navigator, Screen} = createNativeStackNavigator();

export const HomeScreenLayout: React.FC<RootRouteProps> = props => {
  const {t} = useTranslation();

  React.useLayoutEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(props.route);
    props.navigation.setOptions({
      tabBarStyle:
        routeName === 'IssuersScreen' ? {display: 'none'} : undefined,
    });
  }, [props.navigation, props.route]);

  return (
    <Navigator>
      <Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerTitle: '',
          headerShadowVisible: false,
          headerLeft: () => <Text style={styles.title}>AIT Wallet</Text>,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('AitDashboard:profile')}
              onPress={() => props.navigation.navigate('settings' as never)}
              style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>○</Text>
              </View>
              <Text style={styles.profileText}>
                {t('AitDashboard:profile')}
              </Text>
            </Pressable>
          ),
        }}
      />
      <Screen
        name="IssuersScreen"
        component={IssuersScreen}
        options={{
          header: headerProps => (
            <Header
              goBack={headerProps.navigation.goBack}
              title={t('IssuersScreen:title')}
              testID="issuersScreenHeader"
            />
          ),
        }}
      />
    </Navigator>
  );
};

const styles = StyleSheet.create({
  title: {fontSize: 19, fontWeight: '700', color: palette.primary},
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: palette.primary, fontSize: 22},
  profileText: {color: palette.textPrimary, fontSize: 12},
});
