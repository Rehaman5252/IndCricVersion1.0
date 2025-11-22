// lib/user-management-service.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  lastLogin: string;
  lastQuizTaken: string;
}

export interface UserMetrics {
  totalUsers: number;
  activeTodayUsers: string[];
  activeWeekUsers: string[];
  activeMonthUsers: string[];
}

// ✅ Helper function to parse any timestamp format to Date
function parseTimestamp(timestamp: any): Date | undefined {
  try {
    // Firestore Timestamp with toDate() method
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Object with seconds property (Firestore format)
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date(timestamp.seconds * 1000);
    }
    // Already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    // Number (milliseconds)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    // String
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    
    return undefined;
  } catch (error) {
    console.error('Timestamp parsing error:', error);
    return undefined;
  }
}

// ✅ Format Date to Indian locale string
function formatDate(date: Date | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-IN', options || defaultOptions);
}

export function subscribeToUserMetrics(callback: (metrics: UserMetrics) => void) {
  let currentMetrics: UserMetrics = {
    totalUsers: 0,
    activeTodayUsers: [],
    activeWeekUsers: [],
    activeMonthUsers: [],
  };

  const updateMetrics = () => callback({ ...currentMetrics });
  
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Subscribe to total users count
  const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
    currentMetrics.totalUsers = snapshot.size;
    updateMetrics();
  });

  // Subscribe to quiz attempts for active users
  const quizAttemptsUnsub = onSnapshot(collection(db, 'quizAttempts'), (snapshot) => {
    const todaySet = new Set<string>();
    const weekSet = new Set<string>();
    const monthSet = new Set<string>();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId;
      
      const attemptDate = parseTimestamp(data.timestamp);

      if (userId && attemptDate && !isNaN(attemptDate.getTime())) {
        if (attemptDate >= todayStart) todaySet.add(userId);
        if (attemptDate >= sevenDaysAgo) weekSet.add(userId);
        if (attemptDate >= thirtyDaysAgo) monthSet.add(userId);
      }
    });

    currentMetrics.activeTodayUsers = Array.from(todaySet);
    currentMetrics.activeWeekUsers = Array.from(weekSet);
    currentMetrics.activeMonthUsers = Array.from(monthSet);

    updateMetrics();
  });

  // Return unsubscribe function
  return () => {
    usersUnsub();
    quizAttemptsUnsub();
  };
}

export async function getAllUsersWithDetails(): Promise<UserData[]> {
  try {
    const userDocs = await getDocs(collection(db, 'users'));
    const users: UserData[] = [];

    for (const userDoc of userDocs.docs) {
      const data = userDoc.data();
      
      // Parse lastPlayedAt for last login
      const lastPlayedDate = parseTimestamp(data.lastPlayedAt);
      const lastLogin = formatDate(lastPlayedDate);

      // Get last quiz attempt
      let lastQuizTaken = 'N/A';
      try {
        const quizAttempts = await getDocs(
          query(collection(db, 'quizAttempts'), where('userId', '==', userDoc.id))
        );
        
        if (quizAttempts.size > 0) {
          // Find the most recent attempt
          let latestDate: Date | undefined = undefined;
          
          quizAttempts.docs.forEach((attemptDoc) => {
            const attempt = attemptDoc.data();
            const attemptDate = parseTimestamp(attempt.timestamp);
            
            if (attemptDate) {
              if (!latestDate || attemptDate > latestDate) {
                latestDate = attemptDate;
              }
            }
          });
          
          lastQuizTaken = formatDate(latestDate);
        }
      } catch (error) {
        console.warn('Could not fetch quiz attempts for user:', data.email, error);
      }

      users.push({
        uid: userDoc.id,
        displayName: data.name || 'Unknown',
        email: data.email || 'N/A',
        phoneNumber: data.phone || 'N/A',
        lastLogin,
        lastQuizTaken,
      });
    }

    console.log('✅ All users loaded:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUsersByIdsWithDetails(userIds: string[]): Promise<UserData[]> {
  if (userIds.length === 0) return [];
  
  try {
    const allUsers = await getAllUsersWithDetails();
    return allUsers.filter((u) => userIds.includes(u.uid));
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ User deleted:', userId);
  } catch (error) {
    console.error('❌ Error deleting user:', userId, error);
    throw error;
  }
}