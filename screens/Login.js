import { useNavigation } from '@react-navigation/core'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Image, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import { app } from '../firebase'
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import LoginInput from '../components/LoginInput';
import LoginButton from '../components/LoginButton';

const auth = getAuth(app); 
const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const navigation = useNavigation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigation.replace("Home")
      }
    })

    return unsubscribe
  }, [])

  const handleLogin = () => {
    setLoading(true)
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredentials => {
        const user = userCredentials.user;
        setLoading(false)
        navigation.navigate("Home");
      })
      .catch(error => {
        setLoading(false)
        alert(error.message)
      })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/homeplate.png')}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>Pitcher's Plate</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>
            
            <LoginInput
              labelValue={email}
              onChangeText={(userEmail) => setEmail(userEmail)}
              placeholderText="Email"
              iconType="user"
              UIKeyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <LoginInput
              labelValue={password}
              onChangeText={(userPassword) => setPassword(userPassword)}
              placeholderText="Password"
              iconType="lock"
              UIKeyboardType="default"
              secureTextEntry={true}
            />

            <LoginButton
              buttonTitle={loading ? "Signing In..." : "Sign In"}
              onPress={() => handleLogin()}
              disabled={loading || !email || !password}
            />

            <TouchableOpacity style={styles.forgotButton} onPress={() => {}}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Create Account')}>
              <Text style={styles.createAccountText}>
                Don't have an account? <Text style={styles.createAccountTextBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    height: 120,
    width: 120,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#0782F9',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 15,
  },
  forgotText: {
    fontSize: 14,
    color: '#0782F9',
  },
  footerContainer: {
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
  },
  createAccountButton: {
    alignItems: 'center',
    padding: 15,
  },
  createAccountText: {
    fontSize: 16,
    color: '#666',
  },
  createAccountTextBold: {
    fontWeight: 'bold',
    color: '#0782F9',
  },
});