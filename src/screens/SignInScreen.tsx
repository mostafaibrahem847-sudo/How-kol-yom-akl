import React from 'react';
// Email/password uses the legacy Clerk hook contract (`{ isLoaded, signIn,
// setActive }`) provided by this SDK generation. The top-level hooks return the
// newer signal value, which this screen's flow is not written against.
import { useSignIn } from '@clerk/expo/legacy';
import { useNavigation } from '@react-navigation/native';
import AuthForm from '../components/AuthForm';
import { clerkErrorMessage } from '../lib/clerkErrors';

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const { isLoaded, signIn, setActive } = useSignIn();

  const handleSubmit = async (email: string, password: string): Promise<string | null> => {
    if (!isLoaded || !signIn || !setActive) return null;
    try {
      const completeSignIn = await signIn.create({
        strategy: 'password',
        identifier: email,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
      navigation.replace('Tabs');
      return null;
    } catch (err) {
      return clerkErrorMessage(err, 'signIn');
    }
  };

  return <AuthForm mode="signIn" onSubmit={handleSubmit} />;
}
