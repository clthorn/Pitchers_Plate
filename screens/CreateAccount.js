import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, KeyboardAvoidingView, Platform} from 'react-native';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { app, db } from '../firebase'
import { getAuth, createUserWithEmailAndPassword } from "@firebase/auth"
import { useNavigation } from '@react-navigation/core'
import { doc, setDoc} from "firebase/firestore";
import { SelectList } from 'react-native-dropdown-select-list'

const auth = getAuth(app); 

const SignupScreen = ({}) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [teamID, setTeamID] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  
  const signUp = async () => {  
    try {
      console.log("Creating account with teamID:", teamID, "Type:", typeof teamID);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Convert teamID to string to ensure consistent type
      const teamIDString = String(teamID);
      
      console.log("Storing user with teamID:", teamIDString, "Type:", typeof teamIDString);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: username,
        email: email,
        type: userType,
        teamID: teamIDString,
        sessions: 0
      });
      
      console.log("Account created successfully with teamID:", teamIDString);
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log(error);
    }
  }
  
  const userTypeOptions = [
    {key:'1', value:'Individual'},
    {key:'2', value:'Coach'},
  ]

  const isFormValid = username !== "" && 
                     email !== "" && 
                     teamID !== "" && 
                     password !== "" && 
                     userType !== "";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{flex: 1}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../assets/homeplate.png')}
            style={styles.logo}
          />
          <Text style={styles.headerText}>Pitcher's Plate</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an account</Text>
          
          <FormInput
            labelValue={email}
            onChangeText={(userEmail) => setEmail(userEmail)}
            placeholderText="Email"
            iconType="user"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            labelValue={username}
            onChangeText={(username) => setUsername(username)}
            placeholderText="Username"
            iconType="user"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            labelValue={teamID}
            onChangeText={(teamID) => setTeamID(teamID)}
            placeholderText="Team Identification Number"
            iconType="team"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            labelValue={password}
            onChangeText={(userPassword) => setPassword(userPassword)}
            placeholderText="Password"
            iconType="lock"
            secureTextEntry={true}
          />
          
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Account Type:</Text>
            <SelectList 
              setSelected={(val) => setUserType(val)} 
              data={userTypeOptions} 
              save="value"
              boxStyles={styles.dropdown}
              dropdownStyles={styles.dropdownList}
              placeholder="Select account type"
            />
          </View>
          
          <View style={styles.accountTypeInfo}>
            <Text style={styles.accountTypeTitle}>Account Types:</Text>
            <View style={styles.accountTypeCard}>
              <Text style={styles.accountTypeLabel}>Individual</Text>
              <Text style={styles.accountTypeDescription}>
                For players who want to track their own pitching sessions.
              </Text>
            </View>
            <View style={styles.accountTypeCard}>
              <Text style={styles.accountTypeLabel}>Coach</Text>
              <Text style={styles.accountTypeDescription}>
                For coaches who want to monitor their team's pitching performance.
              </Text>
            </View>
          </View>
          
          <FormButton
            buttonTitle="Sign Up"
            disabled={!isFormValid}
            onPress={() => signUp()}
          />

          <TouchableOpacity
            style={styles.signinButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.navButtonText}>Have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#0782F9',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  formContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    color: '#051d5f',
    fontWeight: 'bold',
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    marginLeft: 5,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  dropdownList: {
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: 'white',
  },
  accountTypeInfo: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  accountTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  accountTypeCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0782F9',
    marginBottom: 5,
  },
  accountTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  signinButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0782F9',
  },
});