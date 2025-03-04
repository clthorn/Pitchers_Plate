import { getAuth, signOut } from '@firebase/auth'
import React  from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from 'react-native'
import { app, db } from '../firebase'
import { doc, setDoc, getDocs, collection, getDoc, query, where, orderBy, limit, updateDoc, increment } from "firebase/firestore";
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';

const auth = getAuth(app);

export var date = "";
const getDate = () => {
  date = new Date().getDate(); //Current Date
  var month = new Date().getMonth() + 1; //Current Month
  var year = new Date().getFullYear(); //Current Year
  var hours = new Date().getHours(); //Current Hours
  var min = new Date().getMinutes(); //Current Minutes
  var sec = new Date().getSeconds(); //Current Seconds
  date = date + '-' + month + '-' + year + ' ' + hours + ':' + min + ':' + sec
}

class HomeScreen extends React.Component{
  auth = getAuth(app);
  constructor(props){
    super(props);
    this.state = {
      sessions: [],
      userType: "",
      sessionArray: [],
      players: [],
      playerArray: [],
      username: "",
      teamSessions: [],
      teamSessionArray: [],
      loading: false,
      error: null
    }
  }

  tableHeaders = ['Creation Date', 'Strikes', 'Balls', 'Pitches'];
  tableHeadersCoach = ['Player Email', 'Player Pitching Sessions'];

  handleSignOut = () => {
    signOut(auth).then(() => {
      this.props.navigation.navigate("Login")
    }).catch((error) => {
      console.error("Sign out error:", error);
    });
    this.setState({sessions: []})
  }
  
  createSession = async () => {
    try {
      this.setState({ loading: true });
      getDate();
      
      // Get user data
      const userQuery = query(collection(db, "users"), where("email", "==", auth.currentUser?.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error("User data not found");
      }
      
      let userData = null;
      userSnapshot.forEach((doc) => {
        userData = doc.data();
      });
      
      if (!userData) {
        throw new Error("User data is empty");
      }
      
      const username = userData.username || "";
      const teamID = userData.teamID || "";
      
      console.log("Creating session for user:", username, "with teamID:", teamID, "Type:", typeof teamID);
      
      // Create session document
      const docRef = doc(db, "sessions", date);
      await setDoc(docRef, {
        user: auth.currentUser?.uid,
        username: username,
        teamID: teamID,
        email: auth.currentUser?.email,
        pitches: 0,
        strikes: 0,
        balls: 0, 
        creationDate: date,
        timestamp: Date.now()
      });
      
      // Update user's session count
      const userDocRef = doc(db, "users", auth.currentUser?.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const currentSessions = userDoc.data().sessions || 0;
        await setDoc(userDocRef, { 
          sessions: currentSessions + 1 
        }, { merge: true });
      }
      
      this.setState({ loading: false });
      console.log("Session created successfully");
      
      return date; // Return the session ID for navigation
    } catch (error) {
      this.setState({ loading: false, error: error.message });
      console.error("Error creating session:", error);
      alert("Error creating session: " + error.message);
      return null;
    }
  }

  getUserType = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!auth.currentUser) {
          console.log("No user is signed in");
          reject(new Error("No user is signed in"));
          return;
        }
        
        const queryForUser = query(collection(db, "users"), where("email", "==", auth.currentUser?.email));
        const querySnapshot = await getDocs(queryForUser);
        
        if (querySnapshot.empty) {
          console.log("No user found with this email");
          reject(new Error("No user found with this email"));
          return;
        }
        
        querySnapshot.forEach((doc) => {
          this.setState({
            userType: doc.data().type || "Individual",
            username: doc.data().username || ""
          });
        });
        
        console.log("User type set to:", this.state.userType);
        resolve();
      } catch (error) {
        console.error("Error getting user type:", error);
        reject(error);
      }
    });
  }
  
  getPlayers = async () => {
    try {
      this.setState({
        loading: true,
        error: null,
        players: [],
        playerArray: []
      });
      
      console.log("Fetching players for coach...");
      
      // First get the coach's teamID
      const coachQuery = query(collection(db, "users"), where("email", "==", auth.currentUser?.email));
      const coachSnapshot = await getDocs(coachQuery);
      
      if (coachSnapshot.empty) {
        console.log("No coach found with email:", auth.currentUser?.email);
        this.setState({
          loading: false,
          error: "No coach found with this email"
        });
        return;
      }
      
      let coachTeamId = "";
      let coachData = null;
      coachSnapshot.forEach((doc) => {
        coachData = doc.data();
        coachTeamId = coachData.teamID || "";
        console.log("Coach document data:", JSON.stringify(coachData));
      });
      
      if (!coachTeamId) {
        console.log("Coach has no teamID");
        this.setState({
          loading: false,
          error: "Coach has no teamID"
        });
        return;
      }
      
      console.log("Coach teamID:", coachTeamId, "Type:", typeof coachTeamId);
      
      // Query for players with the same teamID
      const playersQuery = query(
        collection(db, "users"), 
        where("teamID", "==", coachTeamId),
        where("type", "==", "Individual") // Only get players, not other coaches
      );
      
      console.log("Executing query for players with teamID:", coachTeamId);
      const playersSnapshot = await getDocs(playersQuery);
      console.log("Query returned", playersSnapshot.size, "players");
      
      if (playersSnapshot.empty) {
        console.log("No players found with teamID:", coachTeamId);
        this.setState({
          loading: false,
          playerArray: [[]],
          error: "No players found for this team"
        });
        return;
      }
      
      // Process player data
      const playerData = [];
      playersSnapshot.forEach((doc) => {
        const player = doc.data();
        console.log("Found player:", player.email, "with teamID:", player.teamID);
        playerData.push(player);
      });
      
      // Format player data for table display
      const formattedPlayers = playerData.map(player => [
        player.email || "No email",
        player.sessions || 0
      ]);
      
      console.log("Formatted player data:", formattedPlayers);
      
      this.setState({
        players: playerData,
        playerArray: [formattedPlayers],
        loading: false
      });
      
      console.log("Players fetched successfully:", formattedPlayers.length);
    } catch (error) {
      console.error("Error fetching players:", error);
      this.setState({
        loading: false,
        error: "Error fetching players: " + error.message
      });
    }
  }
  
  getSessions = async () => {
    try {
      this.setState({
        loading: true,
        error: null,
        sessions: [],
        sessionArray: []
      });
      
      var localSessions = [];
      
      // Simple query without orderBy
      const queryForSessions = query(
        collection(db, "sessions"), 
        where("user", "==", auth.currentUser?.uid)
      );
      
      const querySnapshot = await getDocs(queryForSessions);
      const sessionData = [];
      
      querySnapshot.forEach((doc) => {
        sessionData.push(doc.data());
      });
      
      // Sort the sessions by creationDate manually (client-side)
      sessionData.sort((a, b) => {
        // This assumes creationDate is in a format that can be compared
        // If not, you might need a different sorting approach
        return a.creationDate < b.creationDate ? 1 : -1;
      });
      
      this.setState({ sessions: sessionData });
      
      // Process the data for display
      sessionData.forEach(session => {
        const row = [
          session.creationDate || '',
          session.strikes || 0,
          session.balls || 0,
          session.pitches || 0
        ];
        localSessions.push(row);
      });
      
      this.setState({
        sessionArray: [localSessions],
        loading: false
      });
      
      console.log("Sessions fetched successfully:", sessionData.length);
    } catch (error) {
      console.error("Error getting sessions:", error);
      this.setState({
        loading: false,
        error: "Error retrieving sessions: " + error.message
      });
    }
  }
  
  getTeamSessions = async () => {
    try {
      this.setState({
        loading: true,
        error: null,
        teamSessions: [],
        teamSessionArray: []
      });
      
      console.log("Fetching team sessions for coach...");
      
      // First get the coach's teamID
      const coachQuery = query(collection(db, "users"), where("email", "==", auth.currentUser?.email));
      const coachSnapshot = await getDocs(coachQuery);
      
      if (coachSnapshot.empty) {
        console.log("No coach found with email:", auth.currentUser?.email);
        this.setState({
          loading: false,
          error: "No coach found with this email"
        });
        return;
      }
      
      let teamId = "";
      let coachData = null;
      coachSnapshot.forEach((doc) => {
        coachData = doc.data();
        teamId = coachData.teamID || "";
        console.log("Coach document data:", JSON.stringify(coachData));
      });
      
      if (!teamId) {
        console.log("Coach has no teamID");
        this.setState({
          loading: false,
          error: "Coach has no teamID"
        });
        return;
      }
      
      console.log("Coach teamID:", teamId, "Type:", typeof teamId);
      
      // First get all players with the same teamID
      const playersQuery = query(
        collection(db, "users"),
        where("teamID", "==", teamId),
        where("type", "==", "Individual")
      );
      
      console.log("Fetching players with teamID:", teamId);
      const playersSnapshot = await getDocs(playersQuery);
      console.log("Found", playersSnapshot.size, "players with teamID:", teamId);
      
      if (playersSnapshot.empty) {
        console.log("No players found with teamID:", teamId);
        this.setState({
          loading: false,
          teamSessionArray: [[]],
          error: "No players found for this team"
        });
        return;
      }
      
      // Get all player IDs
      const playerIds = [];
      playersSnapshot.forEach((doc) => {
        playerIds.push(doc.id);
      });
      
      console.log("Player IDs:", playerIds);
      
      // Now fetch sessions for all these players
      const sessionData = [];
      
      // We need to fetch sessions for each player individually since Firestore
      // doesn't support "in" queries with "where" on multiple fields
      for (const playerId of playerIds) {
        console.log("Fetching sessions for player:", playerId);
        
        const playerSessionsQuery = query(
          collection(db, "sessions"),
          where("user", "==", playerId),
          orderBy("timestamp", "desc")
        );
        
        const playerSessionsSnapshot = await getDocs(playerSessionsQuery);
        console.log("Found", playerSessionsSnapshot.size, "sessions for player:", playerId);
        
        playerSessionsSnapshot.forEach((doc) => {
          const session = doc.data();
          console.log("Found session:", session.creationDate, "for player:", session.username);
          sessionData.push(session);
        });
      }
      
      if (sessionData.length === 0) {
        console.log("No sessions found for any team players");
        this.setState({
          loading: false,
          teamSessionArray: [[]],
          error: "No sessions found for any team players"
        });
        return;
      }
      
      // Sort sessions by creationDate (newest first)
      sessionData.sort((a, b) => {
        return a.timestamp > b.timestamp ? -1 : 1;
      });
      
      // Format session data for table display
      const formattedSessions = sessionData.map(session => [
        (session.email || "Unknown") + "\n" + (session.username || ""),
        session.creationDate || "",
        session.strikes || 0,
        session.balls || 0,
        session.pitches || 0
      ]);
      
      console.log("Formatted session data:", formattedSessions.length, "sessions");
      
      this.setState({
        teamSessions: sessionData,
        teamSessionArray: [formattedSessions],
        loading: false
      });
      
      console.log("Team sessions fetched successfully:", formattedSessions.length);
    } catch (error) {
      console.error("Error fetching team sessions:", error);
      this.setState({
        loading: false,
        error: "Error fetching team sessions: " + error.message
      });
    }
  }
  
  componentDidMount() {
    try {
      console.log("Home screen mounted, initializing...");
      
      // Get user type first
      this.getUserType().then(() => {
        // Run the teamID fix first
        return this.fixTeamIDTypes();
      }).then(() => {
        // Then get sessions or players based on user type
        if (this.state.userType === "Coach") {
          console.log("Coach user detected, getting players...");
          this.getPlayers();
        } else {
          console.log("Individual user detected, getting sessions...");
          this.getSessions();
        }
      }).catch(error => {
        console.error("Error in initialization sequence:", error);
      });
    } catch (error) {
      console.error("Error in componentDidMount:", error);
    }
  }


  render(){
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../assets/homeplate.png')}
            style={styles.logo}
          />
          <Text style={styles.headerText}>Pitcher's Plate</Text>
        </View>
        
        {this.state.loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0782F9" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        
        {this.state.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{this.state.error}</Text>
          </View>
        )}
        
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoCard}>
            <Text style={styles.userEmail}>{auth.currentUser?.email}</Text>
            <Text style={styles.userName}>Username: {this.state.username}</Text>
            <Text style={styles.userType}>Account type: {this.state.userType}</Text>
          </View>
        </View>

        {this.state.userType === "Coach" && (
          <View>
            <View style={styles.tableContainer}>
              <Text style={styles.sectionTitle}>Your Team Players</Text>
              <Table borderStyle={{borderWidth: 1, borderColor: '#000000'}}>
                <Row data={this.tableHeadersCoach} style={styles.HeadStyle} textStyle={styles.TableHeaderText}/>
                {this.state.playerArray[0] && this.state.playerArray[0].length > 0 ? (
                  <Rows data={this.state.playerArray[0]} textStyle={styles.TableText}/>
                ) : (
                  <Row data={['No players found']} textStyle={styles.TableText}/>
                )}
              </Table>
              <TouchableOpacity
                onPress={this.getPlayers}
                style={styles.refreshButton}
              >
                <Text style={styles.buttonText}>Refresh Player List</Text>
              </TouchableOpacity>
            
            </View>
          </View>
        )}

        {this.state.userType === "Individual" && (
          <View style={styles.tableContainer}>
            <Text style={styles.sectionTitle}>Your Pitching Sessions</Text>
            <Table borderStyle={{borderWidth: 1, borderColor: '#000000'}}>
              <Row data={this.tableHeaders} style={styles.HeadStyle} textStyle={styles.TableHeaderText}/>
              {this.state.sessionArray[0] && this.state.sessionArray[0].length > 0 ? (
                <Rows data={this.state.sessionArray[0]} textStyle={styles.TableText}/>
              ) : (
                <Row data={['No sessions found']} textStyle={styles.TableText}/>
              )}
            </Table>
            <TouchableOpacity
              onPress={this.getSessions}
              style={styles.refreshButton}
            >
              <Text style={styles.buttonText}>Refresh Sessions</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          {this.state.userType === "Individual" && (
            <TouchableOpacity
              onPress={() => this.createSession().then(() => this.props.navigation.navigate('Session'))}
              style={styles.startSessionButton}
            >
              <Text style={styles.buttonText}>Start Session</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={this.handleSignOut}
            style={styles.signOutButton}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    width: "100%",
    height: "100%"
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
  userInfoContainer: {
    padding: 15,
  },
  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userName: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  userType: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableContainer: {
    padding: 15,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  HeadStyle: { 
    height: 50,
    backgroundColor: '#0782F9',
  },
  TableHeaderText: {
    margin: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  TableText: { 
    margin: 6,
    textAlign: 'center',
    color: '#333',
  },
  actionButtonsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  startSessionButton: {
    backgroundColor: '#0782F9',
    width: '80%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    width: '80%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0782F9',
  },
  errorContainer: {
    padding: 15,
    margin: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  }
});