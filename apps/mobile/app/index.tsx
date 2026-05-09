import { Redirect } from 'expo-router';

/**
 * App entry — sends users to the auth/landing screen first.
 * From auth they can either sign in OR tap "Browse listings without signing in"
 * to drop into the (tabs) home screen.
 */
export default function Index() {
  return <Redirect href={'/auth' as any} />;
}
