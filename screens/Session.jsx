import React, {useState, useContext} from 'react';
import { getAuth } from '@firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView
} from 'react-native';
import { date } from './Home';
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { app, db } from '../firebase'
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";




/**
 * Class for rendering the pitches to the screen.
 */


class RenderPitch extends React.Component {
    render(){
        return (
          <View>
              {this.props.pitches.map((prop, key) => {
                const isStrike = !((prop[0] < -10 || prop[0] > 195) || (prop[1] < -5 || prop[1] > 145));
                return (
                  <View 
                    key={key}
                    style={[{
                      backgroundColor: isStrike ? 'red' : 'blue',
                      height: 12,
                      width: 12, 
                      borderRadius: 50, 
                      position: 'absolute',
                      top: prop[0],
                      right: prop[1],
                      elevation: 10,
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }]}>
                  </View>
                );
              })}
          </View>
        )
    }
}


    
/**
 * Class that displays the screen for a pitching session
 */
class SessionScreen extends React.Component {
  auth = getAuth(app);
  constructor(props) {
    super(props);    
    this.state = {
      post : null,
      strikes : 0,
      balls : 0,
      pitches : [],
      pitch : 0,
      strikeThrown : false,
      ballThrown : false,
      connectingBluetooth : false,
      devices : "",
      deviceConnected : false,
    }
  }
  
  throwStrike = async () => {
    this.setState({
      strikes: this.state.strikes + 1,
      pitch: this.state.pitch + 1,
      strikeThrown: true,
      ballThrown: false,
      connectingBluetooth: false
    });
    
    // Generate random position for a strike inside the strike zone
    // Strike zone is defined as y-value between -10 and 195, x-value between -5 and 145
    let yValue = Math.floor(Math.random() * (195 + 10 + 1)) - 10; // Random value between -10 and 195
    let xValue = Math.floor(Math.random() * (145 + 5 + 1)) - 5; // Random value between -5 and 145
    this.state.pitches.push([yValue, xValue]);
    
    console.log("strike thrown");
    this.writeStrikeToDB();
  }
  writeStrikeToDB = async () => {
    try {
      // Get the current session data
      const sessionRef = doc(db, "sessions", date);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const pitchData = sessionData.pitchData || [];
        
        // Add this pitch to the pitchData array
        pitchData.push({
          pitchNumber: this.state.pitch,
          type: "strike",
          location: [this.state.pitches[this.state.pitches.length - 1][0], 
                    this.state.pitches[this.state.pitches.length - 1][1]],
          timestamp: new Date().getTime()
        });
        
        // Calculate strike percentage
        const strikePercentage = Math.round((this.state.strikes / this.state.pitch) * 100);
        
        // Update the session document
        await setDoc(sessionRef, {
          pitches: this.state.pitch,
          strikes: this.state.strikes,
          balls: this.state.balls,
          user: this.auth.currentUser?.uid,
          creationDate: date,
          strikePercentage: strikePercentage,
          pitchData: pitchData
        }, { merge: true });
        
        Alert.alert("Strike", "You have thrown a strike!");
      }
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }
  writeBallToDB = () => {
    const docRef = doc(db, "sessions", date);
    setDoc(docRef, {
      pitches: this.state.pitch,
      strikes: this.state.strikes,
      balls: this.state.balls,
      user: this.auth.currentUser?.uid,
      creationDate: date
    });
  }
  
  throwBall = async () => {
    this.setState({
      balls: this.state.balls + 1,
      pitch: this.state.pitch + 1,
      strikeThrown: false,
      ballThrown: true,
      connectingBluetooth: false
    });
    
    // Generate random position for a ball outside strike zone
    // A ball is outside the strike zone if:
    // y < -10 OR y > 195 or x < -5 OR x > 145
    let yValue, xValue;
    const area = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
    
    switch (area) {
      case 0: // Above strike zone (y < -10)
        yValue = Math.floor(Math.random() * 50) - 60; // Random value between -60 and -11
        xValue = Math.floor(Math.random() * (145 + 5 + 1)) - 5; // Random x within plate width
        break;
      case 1: // Below strike zone (y > 195)
        yValue = Math.floor(Math.random() * 50) + 196; // Random value between 196 and 245
        xValue = Math.floor(Math.random() * (145 + 5 + 1)) - 5; // Random x within plate width
        break;
      case 2: // Left of strike zone (x < -5)
        yValue = Math.floor(Math.random() * (195 + 10 + 1)) - 10; // Random y within strike zone height
        xValue = Math.floor(Math.random() * 50) - 55; // Random value between -55 and -6
        break;
      case 3: // Right of strike zone (x > 145)
        yValue = Math.floor(Math.random() * (195 + 10 + 1)) - 10; // Random y within strike zone height
        xValue = Math.floor(Math.random() * 50) + 146; // Random value between 146 and 195
        break;
    }
    
    this.state.pitches.push([yValue, xValue]);
    
    this.writeBallToDB();
    Alert.alert("Ball", "You have thrown a ball!");
  }
  // startScan = () => {
  //  this.setState({connectingBluetooth: true});
  // }

  sessionEnded = () =>{
    this.props.navigation.navigate('Home');
  }
  
  
  startScan = async() => {
    this.setState({deviceConnected : true});
    // console.log("scanning");
    // this.setState({connectingBluetooth: true});
    // _BleManager.startDeviceScan(null, {
    //   allowDuplicates: false,
    //   },
    //   async (error, device) => {
    //     if (error) {
    //       _BleManager.stopDeviceScan();
    //     }
    //     console.log("local name" + device.localName);
    //     if (device.localName == 'DSD TECH') {
    //         Alert.alert("Plate found");
    //         console.log("devices: " + device.id)
    //         _BleManager.stopDeviceScan();
    //         device.connect().then(async (device)=> {
    //           Alert.alert("Plate connected!");
    //           console.log("here");
    //           this.setState({deviceConnected : true});
    //           console.log(await _BleManager.readCharacteristicForDevice(device.id, "0000ffe0-0000-1000-8000-00805f9b34fb", "0000FFE1-0000-1000-8000-00805F9B34FB"));
    //           //console.log(await _BleManager.characteristicsForDevice(device.id, "0000FFE0-0000-1000-8000-00805F9B34FB"));
    //           //this.getCharacteristics(device);
    //           console.log("device id: " + device.id);
    //           this.setState({device: device.id});
    //         });
    //     } 
    //   }, 
    //   )
  };
  getCharacteristics = async device => {
    console.log(await _BleManager.discoverAllServicesAndCharacteristicsForDevice(device.id));
  }

  getSessions = async () => {
    this.setState({sessions: []})
    this.setState({sessionArray: []});
    var localSessions = [];
    
    try {
      // Query sessions by user ID and order by timestamp (newest first)
      const queryForSessions = query(
        collection(db, "sessions"), 
        where("user", "==", auth.currentUser?.uid),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(queryForSessions);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push(doc.data());
      });
      
      this.setState({ sessions: sessions });
      
      // Format session data for table display
      sessions.forEach(session => {
        const row = [
          session.creationDate,
          session.strikes,
          session.balls,
          session.pitches
        ];
        localSessions.push(row);
      });
      
      this.setState({sessionArray: [localSessions]});
    } catch (error) {
      console.error("Error getting sessions:", error);
    }
  }

  


  render(){
    const strikePercentage = this.state.pitch > 0 
      ? Math.round((this.state.strikes / this.state.pitch) * 100) 
      : 0;
      
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Pitching Session</Text>
        </View>
        
        <View style={styles.sessionInfoCard}>
          <Text style={styles.sessionInfoTitle}>Session Information</Text>
          <Text style={styles.sessionInfoText}>Start Time: {date}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{this.state.pitch}</Text>
              <Text style={styles.statLabel}>Pitches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#4CAF50'}]}>{this.state.strikes}</Text>
              <Text style={styles.statLabel}>Strikes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#F44336'}]}>{this.state.balls}</Text>
              <Text style={styles.statLabel}>Balls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#2196F3'}]}>{strikePercentage}%</Text>
              <Text style={styles.statLabel}>Strike %</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.plateConnectionCard}>
          <Text style={styles.plateConnectionTitle}>Plate Connection</Text>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={this.startScan}
          >
            <Text style={styles.buttonText}>Scan for Plate</Text>
          </TouchableOpacity>
          
          <View style={styles.connectionStatus}>
            {this.state.connectingBluetooth && 
              <ActivityIndicator size="large" color="#0782F9" />
            }
            
            {this.state.deviceConnected ? (
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, {backgroundColor: '#4CAF50'}]} />
                  <Text style={styles.statusText}>Plate Connected</Text>
                </View>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, {backgroundColor: '#F44336'}]} />
                  <Text style={styles.statusText}>Plate Not Connected</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.pitchingZoneCard}>
          <Text style={styles.pitchingZoneTitle}>Pitching Zone</Text>
          <View style={styles.zoneContainer}>
            <View style={styles.strikeZone}>
              {this.state.strikeThrown && <RenderPitch pitches={this.state.pitches} />}
              {this.state.ballThrown && <RenderPitch pitches={this.state.pitches} />}
            </View>
          </View>
          
          <View style={styles.pitchButtonsContainer}>
            <TouchableOpacity 
              style={[styles.pitchButton, styles.strikeButton]} 
              onPress={this.throwStrike}
            >
              <Text style={styles.pitchButtonText}>Throw Strike</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pitchButton, styles.ballButton]} 
              onPress={this.throwBall}
            >
              <Text style={styles.pitchButtonText}>Throw Ball</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.endSessionButton} 
          onPress={this.sessionEnded}
        >
          <Text style={styles.buttonText}>End Session</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
};

export default SessionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: '#0782F9',
    paddingVertical: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  sessionInfoCard: {
    backgroundColor: 'white',
    margin: 15,
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
  sessionInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  plateConnectionCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
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
  plateConnectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#0782F9',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  connectionStatus: {
    marginTop: 15,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  pitchingZoneCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
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
    alignItems: 'center',
  },
  pitchingZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  zoneContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  strikeZone: {
    width: 150,
    height: 200,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  pitchButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  pitchButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '48%',
  },
  strikeButton: {
    backgroundColor: '#4CAF50',
  },
  ballButton: {
    backgroundColor: '#F44336',
  },
  pitchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endSessionButton: {
    backgroundColor: '#FF6B6B',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});