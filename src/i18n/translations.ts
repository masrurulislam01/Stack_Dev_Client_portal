export type Language = 'en' | 'bn';

export interface TranslationDictionary {
  nav: {
    administration: string;
    clientWorkspace: string;
    adminDashboard: string;
    clients: string;
    projects: string;
    paymentsToVerify: string;
    dashboard: string;
    invoices: string;
    files: string;
    messages: string;
    settings: string;
    skipToContent: string;
    studioLocation: string;
  };
  topbar: {
    roleAdmin: string;
    roleClient: string;
    logout: string;
    switchToLight: string;
    switchToDark: string;
    switchLanguage: string;
    notifications: string;
    markAllRead: string;
    noNotifications: string;
    noNotificationsHint: string;
    newNotificationCount: string;
  };
  actions: {
    signIn: string;
    signingIn: string;
    sendResetLink: string;
    backToSignIn: string;
    forgotPassword: string;
    saveChanges: string;
    saving: string;
    cancel: string;
    delete: string;
    deleting: string;
    confirm: string;
    createProject: string;
    newProject: string;
    addClient: string;
    createInvoice: string;
    downloadPdf: string;
    payOnline: string;
    markPaid: string;
    open: string;
    view: string;
    send: string;
    uploadFiles: string;
    approve: string;
    requestChanges: string;
    backToDashboard: string;
  };
  dashboard: {
    adminTitle: string;
    adminSubtitle: string;
    activeProjects: string;
    totalClients: string;
    unpaidInvoices: string;
    dueNext7Days: string;
    dueNext7DaysHint: string;
    noUpcomingDeadlines: string;
    viewAllProjects: string;
    viewAllClients: string;
    viewAllInvoices: string;
  };
  settings: {
    title: string;
    subtitle: string;
    profileSection: string;
    profileHint: string;
    fullName: string;
    emailAddress: string;
    roleLabel: string;
    clientWorkspaceId: string;
    saveProfile: string;
    profileSaved: string;
    securitySection: string;
    securityHint: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    updatePassword: string;
    updatingPassword: string;
    passwordUpdated: string;
    appearanceSection: string;
    appearanceHint: string;
    themeLabel: string;
    lightMode: string;
    darkMode: string;
    languageLabel: string;
    languageHint: string;
    backupSection: string;
    backupHint: string;
    exportJson: string;
    exportCsv: string;
    exporting: string;
  };
  notFound: {
    code: string;
    title: string;
    description: string;
    goHome: string;
    goLogin: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    nav: {
      administration: 'Administration',
      clientWorkspace: 'Client Workspace',
      adminDashboard: 'Overview',
      clients: 'Clients',
      dashboard: 'Dashboard',
      projects: 'Projects',
      paymentsToVerify: 'Verify Payments',
      invoices: 'Invoices',
      files: 'Files',
      messages: 'Messages',
      settings: 'Settings',
      skipToContent: 'Skip to main content',
      studioLocation: 'Dhaka, Bangladesh',
    },
    topbar: {
      roleAdmin: 'Admin',
      roleClient: 'Client',
      logout: 'Log out',
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
      switchLanguage: 'Switch language to Bangla',
      notifications: 'Notifications',
      markAllRead: 'Mark all read',
      noNotifications: 'All caught up',
      noNotificationsHint: 'New updates, messages, milestone reviews, and invoices will appear here.',
      newNotificationCount: 'unread notifications',
    },
    actions: {
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      sendResetLink: 'Send reset link',
      backToSignIn: 'Back to sign in',
      forgotPassword: 'Forgot password?',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      deleting: 'Deleting...',
      confirm: 'Confirm',
      createProject: 'Create Project',
      newProject: 'New Project',
      addClient: 'Add Client',
      createInvoice: 'Create Invoice',
      downloadPdf: 'Download PDF',
      payOnline: 'Pay Now',
      markPaid: 'Mark Paid',
      open: 'Open',
      view: 'View',
      send: 'Send',
      uploadFiles: 'Upload Files',
      approve: 'Approve',
      requestChanges: 'Request Changes',
      backToDashboard: 'Back to Dashboard',
    },
    dashboard: {
      adminTitle: 'Agency Overview',
      adminSubtitle: 'Live summary of active client projects, accounts, unpaid BDT invoices, and upcoming deadlines.',
      activeProjects: 'Active Projects',
      totalClients: 'Clients',
      unpaidInvoices: 'Unpaid Invoices (BDT)',
      dueNext7Days: 'Due in Next 7 Days',
      dueNext7DaysHint: 'Active projects with delivery deadlines within the next 7 days.',
      noUpcomingDeadlines: 'No projects are due within the next 7 days.',
      viewAllProjects: 'View all projects',
      viewAllClients: 'Manage clients',
      viewAllInvoices: 'View invoices',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile name, account password, theme appearance, and preferred language.',
      profileSection: 'Profile Information',
      profileHint: 'Update your display name shown on updates, messages, and reviews.',
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      roleLabel: 'Account Role',
      clientWorkspaceId: 'Workspace ID',
      saveProfile: 'Save Name',
      profileSaved: 'Profile name updated successfully.',
      securitySection: 'Change Password',
      securityHint: 'Verify your current password before setting a new password.',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      updatePassword: 'Update Password',
      updatingPassword: 'Updating password...',
      passwordUpdated: 'Your password has been updated.',
      appearanceSection: 'Appearance & Language',
      appearanceHint: 'Customize light or dark mode and switch portal navigation language.',
      themeLabel: 'Color Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
      languageLabel: 'Portal Language',
      languageHint: 'Switch main navigation labels and action buttons between English and বাংলা.',
      backupSection: 'Backup & Data Export',
      backupHint: 'Download a manual backup of clients, projects, invoices, and payment records for safekeeping.',
      exportJson: 'Export Data (JSON)',
      exportCsv: 'Export CSV Files',
      exporting: 'Exporting...',
    },
    notFound: {
      code: '404',
      title: 'Page not found',
      description: 'The page you requested does not exist or may have been moved.',
      goHome: 'Go to Dashboard',
      goLogin: 'Back to Sign In',
    },
  },
  bn: {
    nav: {
      administration: 'অ্যাডমিন প্যানেল',
      clientWorkspace: 'ক্লায়েন্ট ওয়ার্কস্পেস',
      adminDashboard: 'ড্যাশবোর্ড',
      clients: 'ক্লায়েন্ট',
      dashboard: 'ড্যাশবোর্ড',
      projects: 'প্রজেক্ট',
      paymentsToVerify: 'পেমেন্ট যাচাই',
      invoices: 'ইনভয়েস',
      files: 'ফাইল',
      messages: 'মেসেজ',
      settings: 'সেটিংস',
      skipToContent: 'মূল অংশে যান',
      studioLocation: 'ঢাকা, বাংলাদেশ',
    },
    topbar: {
      roleAdmin: 'অ্যাডমিন',
      roleClient: 'ক্লায়েন্ট',
      logout: 'লগ আউট',
      switchToLight: 'লাইট মোডে যান',
      switchToDark: 'ডার্ক মোডে যান',
      switchLanguage: 'ভাষা ইংরেজিতে পরিবর্তন করুন',
      notifications: 'নোটিফিকেশন',
      markAllRead: 'সব পড়া হয়েছে',
      noNotifications: 'কোনো নতুন নোটিফিকেশন নেই',
      noNotificationsHint: 'নতুন আপডেট, মেসেজ, মাইলস্টোন ও ইনভয়েস এখানে দেখা যাবে।',
      newNotificationCount: 'টি অপঠিত নোটিফিকেশন',
    },
    actions: {
      signIn: 'সাইন ইন',
      signingIn: 'সাইন ইন হচ্ছে...',
      sendResetLink: 'রিসেট লিংক পাঠান',
      backToSignIn: 'সাইন ইনে ফিরুন',
      forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      saveChanges: 'পরিবর্তন সেভ করুন',
      saving: 'সেভ হচ্ছে...',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      deleting: 'মুছে ফেলা হচ্ছে...',
      confirm: 'নিশ্চিত করুন',
      createProject: 'প্রজেক্ট তৈরি করুন',
      newProject: 'নতুন প্রজেক্ট',
      addClient: 'নতুন ক্লায়েন্ট',
      createInvoice: 'ইনভয়েস তৈরি করুন',
      downloadPdf: 'PDF ডাউনলোড',
      payOnline: 'পেমেন্ট করুন',
      markPaid: 'পেইড চিহ্নিত করুন',
      open: 'খুলুন',
      view: 'দেখুন',
      send: 'পাঠান',
      uploadFiles: 'ফাইল আপলোড',
      approve: 'অনুমোদন করুন',
      requestChanges: 'পরিবর্তন চান',
      backToDashboard: 'ড্যাশবোর্ডে ফিরুন',
    },
    dashboard: {
      adminTitle: 'এজেন্সি ড্যাশবোর্ড',
      adminSubtitle: 'চলমান প্রজেক্ট, ক্লায়েন্ট, বকেয়া বিল (BDT) এবং আসন্ন ডেডলাইনের সারসংক্ষেপ।',
      activeProjects: 'চলমান প্রজেক্ট',
      totalClients: 'মোট ক্লায়েন্ট',
      unpaidInvoices: 'বকেয়া ইনভয়েস (BDT)',
      dueNext7Days: 'আগামী ৭ দিনের ডেডলাইন',
      dueNext7DaysHint: 'আগামী ৭ দিনের মধ্যে ডেলিভারি নির্ধারিত চলমান প্রজেক্টসমূহ।',
      noUpcomingDeadlines: 'আগামী ৭ দিনের মধ্যে কোনো প্রজেক্টের ডেডলাইন নেই।',
      viewAllProjects: 'সব প্রজেক্ট দেখুন',
      viewAllClients: 'ক্লায়েন্ট দেখুন',
      viewAllInvoices: 'সব ইনভয়েস দেখুন',
    },
    settings: {
      title: 'সেটিংস',
      subtitle: 'আপনার নাম, পাসওয়ার্ড, থিম এবং পছন্দের ভাষা পরিবর্তন করুন।',
      profileSection: 'প্রোফাইল তথ্য',
      profileHint: 'আপডেট, মেসেজ এবং রিভিউতে প্রদর্শিত আপনার নাম পরিবর্তন করুন।',
      fullName: 'পূর্ণ নাম',
      emailAddress: 'ইমেইল ঠিকানা',
      roleLabel: 'অ্যাকাউন্টের ধরন',
      clientWorkspaceId: 'ওয়ার্কস্পেস আইডি',
      saveProfile: 'নাম সেভ করুন',
      profileSaved: 'প্রোফাইলের নাম সফলভাবে আপডেট হয়েছে।',
      securitySection: 'পাসওয়ার্ড পরিবর্তন',
      securityHint: 'নতুন পাসওয়ার্ড সেট করার আগে আপনার বর্তমান পাসওয়ার্ড দিন।',
      currentPassword: 'বর্তমান পাসওয়ার্ড',
      newPassword: 'নতুন পাসওয়ার্ড',
      confirmPassword: 'নতুন পাসওয়ার্ড নিশ্চিত করুন',
      updatePassword: 'পাসওয়ার্ড আপডেট করুন',
      updatingPassword: 'আপডেট হচ্ছে...',
      passwordUpdated: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
      appearanceSection: 'থিম ও ভাষা',
      appearanceHint: 'লাইট বা ডার্ক মোড এবং পোর্টালের ভাষা নির্বাচন করুন।',
      themeLabel: 'কালার থিম',
      lightMode: 'লাইট',
      darkMode: 'ডার্ক',
      languageLabel: 'পোর্টালের ভাষা',
      languageHint: 'মূল নেভিগেশন ও বাটনগুলোর ভাষা English ও বাংলা-র মধ্যে পরিবর্তন করুন।',
      backupSection: 'ডেটা ব্যাকআপ ও এক্সপোর্ট',
      backupHint: 'ক্লায়েন্ট, প্রজেক্ট, ইনভয়েস এবং পেমেন্ট তথ্যের ম্যানুয়াল ব্যাকআপ ডাউনলোড করুন।',
      exportJson: 'ডেটা এক্সপোর্ট (JSON)',
      exportCsv: 'CSV ফাইল ডাউনলোড',
      exporting: 'এক্সপোর্ট হচ্ছে...',
    },
    notFound: {
      code: '৪০৪',
      title: 'পেজটি পাওয়া যায়নি',
      description: 'আপনি যে পেজটি খুঁজছেন তা সরানো হয়েছে বা অস্তিত্ব নেই।',
      goHome: 'ড্যাশবোর্ডে যান',
      goLogin: 'সাইন ইন পেজে ফিরুন',
    },
  },
};
