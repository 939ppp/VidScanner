import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera ya Gallery ki permission allow karein.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.7,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        extractTextFromImage(asset.base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Image select karne mein masla aaya.');
    }
  };

  const extractTextFromImage = async (base64Image) => {
    setLoading(true);
    setExtractedText('');

    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: 'helloworld',
        },
        body: formData,
      });

      const data = await response.json();

      if (data?.ParsedResults && data.ParsedResults.length > 0) {
        const text = data.ParsedResults[0].ParsedText.trim();
        setExtractedText(text || 'Is tasveer mein koi text nahi mila.');
      } else {
        setExtractedText('Text extract nahi ho saka. Saaf tasveer ke saath dobara koshish karein.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Internet connection check karein aur dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;
    await Clipboard.setStringAsync(extractedText);
    Alert.alert('Copied!', 'Text clipboard par copy ho gaya hai.');
  };

  const shareText = async () => {
    if (!extractedText) return;
    await Share.share({ message: extractedText });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>VidScanner</Text>
        <Text style={styles.subtitle}>Image to Text (Lens)</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(true)}>
          <Text style={styles.btnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(false)}>
          <Text style={styles.btnText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        )}

        {loading && (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loaderText}>Text scan ho raha hai...</Text>
          </View>
        )}

        {extractedText !== '' && !loading && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Extracted Text:</Text>
            <Text selectable style={styles.resultText}>
              {extractedText}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
                <Text style={styles.actionBtnText}>Copy Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={shareText}>
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e4e8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a73e8',
  },
  subtitle: {
    fontSize: 13,
    color: '#5f6368',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  primaryBtn: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
  },
  secondaryBtn: {
    backgroundColor: '#34a853',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    marginBottom: 16,
  },
  loaderBox: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 15,
    color: '#5f6368',
  },
  resultBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 15,
    color: '#3c4043',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareBtn: {
    backgroundColor: '#5f6368',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
