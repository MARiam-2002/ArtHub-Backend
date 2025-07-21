# دليل ربط الفرونت إند بـ API التصدير

## 🎯 **طريقة التحميل المباشر (الأسهل)**

### React/Next.js
```jsx
import { useState } from 'react';

const ExportUsers = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // الحصول على token من localStorage أو context
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/users/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // تحميل الملف مباشرة
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('تم تصدير البيانات بنجاح!');
      } else {
        throw new Error('فشل في التصدير');
      }
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert('فشل في تصدير البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={isLoading}
      className="export-btn"
    >
      {isLoading ? 'جاري التصدير...' : 'تصدير المستخدمين'}
    </button>
  );
};
```

### Vue.js
```vue
<template>
  <button 
    @click="handleExport"
    :disabled="isLoading"
    class="export-btn"
  >
    {{ isLoading ? 'جاري التصدير...' : 'تصدير المستخدمين' }}
  </button>
</template>

<script>
export default {
  data() {
    return {
      isLoading: false
    };
  },
  methods: {
    async handleExport() {
      try {
        this.isLoading = true;
        
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch('/api/admin/users/export', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          this.$toast.success('تم تصدير البيانات بنجاح!');
        } else {
          throw new Error('فشل في التصدير');
        }
      } catch (error) {
        console.error('خطأ في التصدير:', error);
        this.$toast.error('فشل في تصدير البيانات');
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>
```

### Angular
```typescript
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-export-users',
  template: `
    <button 
      (click)="handleExport()"
      [disabled]="isLoading"
      class="export-btn"
    >
      {{ isLoading ? 'جاري التصدير...' : 'تصدير المستخدمين' }}
    </button>
  `
})
export class ExportUsersComponent {
  isLoading = false;

  constructor(private http: HttpClient) {}

  async handleExport() {
    try {
      this.isLoading = true;
      
      const token = localStorage.getItem('adminToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.get('/api/admin/users/export', {
        headers,
        responseType: 'blob'
      }).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('تم تصدير البيانات بنجاح!');
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      alert('فشل في تصدير البيانات');
    } finally {
      this.isLoading = false;
    }
  }
}
```

## 2️⃣ **طريقة Service/API Layer**

### React/Next.js Service
```javascript
// services/exportService.js
export class ExportService {
  static async exportUsers(token) {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  static downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// استخدام في Component
import { ExportService } from '../services/exportService';

const handleExport = async () => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem('adminToken');
    const blob = await ExportService.exportUsers(token);
    ExportService.downloadFile(blob, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    alert('تم التصدير بنجاح!');
  } catch (error) {
    alert('فشل في التصدير');
  } finally {
    setIsLoading(false);
  }
};
```

## 3️⃣ **طريقة Axios (إذا كنت تستخدم Axios)**

```javascript
import axios from 'axios';

const exportUsers = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await axios.get('/api/admin/users/export', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob' // مهم جداً!
    });

    // تحميل الملف
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Export error:', error);
  }
};
```

## 4️⃣ **طريقة React Query (إذا كنت تستخدم React Query)**

```javascript
import { useMutation } from '@tanstack/react-query';

const useExportUsers = () => {
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/users/export', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return response.blob();
    },
    onSuccess: (blob) => {
      // تحميل الملف
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('تم التصدير بنجاح!');
    },
    onError: (error) => {
      console.error('Export error:', error);
      alert('فشل في التصدير');
    }
  });
};

// استخدام في Component
const ExportButton = () => {
  const exportMutation = useExportUsers();

  return (
    <button 
      onClick={() => exportMutation.mutate()}
      disabled={exportMutation.isPending}
    >
      {exportMutation.isPending ? 'جاري التصدير...' : 'تصدير المستخدمين'}
    </button>
  );
};
```

## 5️⃣ **طريقة Flutter (إذا كان الفرونت Flutter)**

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class ExportService {
  static Future<void> exportUsers(String token) async {
    try {
      final response = await http.get(
        Uri.parse('https://art-hub-backend.vercel.app/api/admin/users/export'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // حفظ الملف
        final directory = await getApplicationDocumentsDirectory();
        final file = File('${directory.path}/users_export.xlsx');
        await file.writeAsBytes(response.bodyBytes);
        
        // يمكنك هنا فتح الملف أو مشاركته
        print('تم حفظ الملف في: ${file.path}');
      } else {
        throw Exception('فشل في التصدير');
      }
    } catch (e) {
      print('خطأ في التصدير: $e');
    }
  }
}

// استخدام في Widget
class ExportButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () async {
        final token = await getStoredToken(); // احصل على token
        await ExportService.exportUsers(token);
      },
      child: Text('تصدير المستخدمين'),
    );
  }
}
```

## 6️⃣ **طريقة React Native**

```javascript
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';

const exportUsers = async () => {
  try {
    const token = await AsyncStorage.getItem('adminToken');
    
    const response = await fetch('https://art-hub-backend.vercel.app/api/admin/users/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // حفظ الملف
      const filePath = `${RNFS.DocumentDirectoryPath}/users_export.xlsx`;
      await RNFS.writeFile(filePath, uint8Array, 'base64');
      
      Alert.alert('نجح', 'تم تصدير البيانات بنجاح!');
    } else {
      throw new Error('فشل في التصدير');
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('خطأ', 'فشل في تصدير البيانات');
  }
};
```

## 📋 **النقاط المهمة:**

1. **✅ Authentication:** تأكد من إرسال token في header
2. **✅ Response Type:** استخدم `blob` للتحميل المباشر
3. **✅ Error Handling:** تعامل مع الأخطاء بشكل مناسب
4. **✅ Loading State:** أظهر حالة التحميل للمستخدم
5. **✅ File Naming:** استخدم اسم ملف مناسب مع التاريخ

## 🎯 **الاستخدام الأسهل:**

```javascript
// أبسط طريقة
const exportUsers = async () => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch('/api/admin/users/export', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
```

هذا كل ما تحتاجه لربط الفرونت إند بـ API التصدير! 🚀 