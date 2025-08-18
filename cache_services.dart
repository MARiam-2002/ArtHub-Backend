import 'dart:convert';
import 'dart:developer';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CacheServices {
  CacheServices._private();
  static CacheServices get instance {
    return _instance;
  }

  late FlutterSecureStorage storage;
  late SharedPreferences prefs;

  static final CacheServices _instance = CacheServices._private();

  // CacheServices() {
  //   init();
  // }

  Future<void> init() async {
    AndroidOptions getAndroidOptions() =>
        const AndroidOptions(encryptedSharedPreferences: true);
    storage = FlutterSecureStorage(aOptions: getAndroidOptions());
    await SharedPreferences.getInstance().then((value) async => prefs = value);
  }

  // Call this function from your StatefulWidget's initState()

  // UserData? getUserModel()  {
  //   UserData? user;
  //   try {
  //     String? json = prefs.getString('user');

  //     if (json != null) {
  //       var v = jsonDecode(json);
  //       user = UserData.fromJson(v);
  //     } else {
  //       log('user not loaded', name: 'CacheService::getuser');
  //     }
  //   } catch (e) {
  //     log(e.toString(), name: 'CacheService::getuser');
  //   }
  //   return user;
  // }

  // Future<bool> setUserModel(UserData user) async {
  //   try {
  //     await prefs.setString('user', jsonEncode(user.toJson()));
  //     return true;
  //   } catch (e) {
  //     log(e.toString(), name: 'CacheService::setuser');
  //     return false;
  //   }
  // }

  Future<bool> setOnBoarding(bool isSeen) async {
    try {
      await prefs.setBool('onboarding', isSeen);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::onboarding');
      return false;
    }
  }

  Future<bool> setUserLogin(bool isLogin) async {
    try {
      await prefs.setBool('isLogin', isLogin);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setUserLogin');
      return false;
    }
  }

  bool getUserLogin() {
    bool isLogin = false;
    try {
      isLogin = prefs.getBool('isLogin')!;
      return isLogin;
    } catch (e) {
      log(e.toString(), name: 'CacheService::getUserLogin');
      return isLogin;
    }
  }

  bool getOnBoarding() {
    bool isSeen = false;
    try {
      isSeen = prefs.getBool('onboarding')!;
      return isSeen;
    } catch (e) {
      log(e.toString(), name: 'CacheService::onboarding');
      return isSeen;
    }
  }

  Future<bool> setUserType(bool isBuyer) async {
    try {
      await prefs.setBool('isBuyer', isBuyer);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::isBuyer');
      return false;
    }
  }

  bool? getUserType() {
    bool? isBuyer = false;
    try {
      isBuyer = prefs.getBool('isBuyer');
      return isBuyer;
    } catch (e) {
      log(e.toString(), name: 'CacheService::isBuyer');
      return isBuyer;
    }
  }

  Future<bool> removeUserModel() async {
    try {
      await prefs.remove('user');
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::removeuser');
      return false;
    }
  }

  String getLangCode() {
    final cachedLangCode = prefs.getString("LOCALE");
    if (cachedLangCode != null) {
      return cachedLangCode;
    } else {
      return "en";
    }
  }

  Future<bool> setLangCode(String locale) async {
    try {
      await prefs.setString("LOCALE", locale);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setLangCode');
      return false;
    }
  }

  Map<String, dynamic>? getCredintials() {
    Map<String, dynamic>? token;
    try {
      // String? json = prefs.getString('token');
      String? json = prefs.getString('credintials');
      if (json != null) {
        token = jsonDecode(json);
      } else {
        log('credintials not loaded', name: 'CacheService::getCredintials');
      }
    } catch (e) {
      log(e.toString(), name: 'CacheService::getCredintials');
    }
    return token;
  }

  Future<bool> setCredintials(Map<String, dynamic> credintials) async {
    try {
      await prefs.setString('credintials', jsonEncode(credintials));
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setCredintials');
      return false;
    }
  }

  Future<String?> getToken() async {
    String? token;
    try {
      // String? json = prefs.getString('token');
      String? json = await storage.read(key: 'token');
      if (json != null) {
        token = json;
      } else {
        log('token not loaded', name: 'CacheService::getToken');
      }
    } catch (e) {
      log(e.toString(), name: 'CacheService::getToken');
    }
    return token;
  }

  Future<bool> setToken(String token) async {
    try {
      await storage.write(key: 'token', value: token);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setToken');
      return false;
    }
  }
  ///// device token /////

  Future<bool> setDeviceToken(String deviceToken) async {
    try {
      await prefs.setString('deviceToken', deviceToken);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setdeviceToken');
      return false;
    }
  }

  String? getDeviceToken() {
    String? dToken;
    try {
      // String? json = prefs.getString('token');
      String? json = prefs.getString('deviceToken');
      if (json != null) {
        dToken = json;
      } else {
        log('Device token not loaded', name: 'CacheService::getDeviceToken');
      }
    } catch (e) {
      log(e.toString(), name: 'CacheService::getDeviceToken');
    }
    return dToken;
  }

  // الدوال المطلوبة لتخزين واسترجاع وحذف القيم النصية

  Future<bool> setString(String key, String value) async {
    try {
      await prefs.setString(key, value);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::setString');
      return false;
    }
  }

  String? getString(String key) {
    String? value;
    try {
      value = prefs.getString(key);
      if (value == null) {
        log('$key not found', name: 'CacheService::getString');
      }
    } catch (e) {
      log(e.toString(), name: 'CacheService::getString');
    }
    return value;
  }

  Future<bool> remove(String key) async {
    try {
      await prefs.remove(key);
      return true;
    } catch (e) {
      log(e.toString(), name: 'CacheService::remove');
      return false;
    }
  }
}