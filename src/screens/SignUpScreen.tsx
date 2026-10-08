import React from 'react';
// Email/password uses the legacy Clerk hook contract (`{ isLoaded, signUp,
// setActive }`) provided by this SDK generation. The top-level hooks return the
// newer signal value, which this screen's flow is not written against.
import { useSignUp } from '@clerk/expo/legacy';
import { useNavigation } from '@react-navigation/native';
import { t } from '../i18n/strings';
import AuthForm from '../components/AuthForm';
import { clerkErrorMessage } from '../lib/clerkErrors';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { isLoaded, signUp, setActive } = useSignUp();

  const handleSubmit = async (email: string, password: string): Promise<string | null> => {
    if (!isLoaded || !signUp || !setActive) return null;
    try {
      const completeSignUp = await signUp.create({
        emailAddress: email,
        password,
      });
      if (completeSignUp.createdSessionId) {
        await setActive({ session: completeSignUp.createdSessionId });
        navigation.replace('Tabs');
        return null;
      }
      // No session created yet → the instance requires email verification.
      return t.auth.emailVerification;
    } catch (err) {
      return clerkErrorMessage(err, 'signUp');
    }
  };

  return <AuthForm mode="signUp" onSubmit={handleSubmit} />;
}
