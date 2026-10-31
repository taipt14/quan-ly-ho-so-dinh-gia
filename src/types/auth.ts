export type UserRole = 'ADMIN' | 'MANAGER' | 'APPRAISER' | 'STAFF';

export type FeaturePermissionKey =
  | 'create_dossier'      // Thêm mới hồ sơ
  | 'edit_dossier'        // Chỉnh sửa thông tin hồ sơ
  | 'delete_dossier'      // Xóa hồ sơ
  | 'update_status'       // Cập nhật trạng thái quy trình
  | 'export_report'       // Xuất Báo cáo kết quả tư vấn tài sản (3 mẫu)
  | 'export_excel'        // Xuất file Excel
  | 'import_excel'        // Nhập dữ liệu Excel / Google Sheets
  | 'view_kanban'         // Xem quy trình Kanban
  | 'view_dashboard'      // Thống kê & Báo cáo KPI
  | 'use_ai_assistant'    // Trợ lý AI thẩm định
  | 'reset_data'          // Khôi phục dữ liệu mẫu
  | 'manage_permissions'; // Phân quyền & Quản lý người dùng (Admin)

export type FeatureCategory = 'dossier' | 'export_import' | 'tools' | 'admin';

export interface FeatureDefinition {
  key: FeaturePermissionKey;
  label: string;
  category: FeatureCategory;
  description: string;
  shortDesc: string;
}

export const FEATURE_CATEGORIES: { id: FeatureCategory; name: string; icon: string; description: string }[] = [
  {
    id: 'dossier',
    name: 'Quản lý Hồ sơ & Quy trình',
    icon: 'FolderKanban',
    description: 'Quyền tạo, sửa, xóa và chuyển đổi trạng thái tiến độ hồ sơ định giá'
  },
  {
    id: 'export_import',
    name: 'Báo cáo & Nhập / Xuất dữ liệu',
    icon: 'FileSpreadsheet',
    description: 'Quyền xuất báo cáo tư vấn theo 3 mẫu và đồng bộ bảng tính Excel/Sheets'
  },
  {
    id: 'tools',
    name: 'Chức năng hiển thị & Phân tích',
    icon: 'LayoutDashboard',
    description: 'Quyền truy cập giao diện Kanban, thống kê KPI và trợ lý AI thông minh'
  },
  {
    id: 'admin',
    name: 'Quản trị hệ thống & Phân quyền',
    icon: 'ShieldAlert',
    description: 'Đặc quyền cấu hình hệ thống, quản lý tài khoản và phân quyền tính năng'
  }
];

export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // 1. Quản lý Hồ sơ
  {
    key: 'create_dossier',
    label: 'Thêm mới hồ sơ',
    category: 'dossier',
    shortDesc: 'Tạo hồ sơ định giá mới',
    description: 'Cho phép khởi tạo hồ sơ thẩm định giá tài sản mới với đầy đủ trường dữ liệu pháp lý & khách hàng.'
  },
  {
    key: 'edit_dossier',
    label: 'Chỉnh sửa hồ sơ',
    category: 'dossier',
    shortDesc: 'Cập nhật nội dung hồ sơ',
    description: 'Cho phép sửa đổi thông tin chi tiết của hồ sơ, tài sản, giá trị và thẩm định viên phụ trách.'
  },
  {
    key: 'delete_dossier',
    label: 'Xóa hồ sơ',
    category: 'dossier',
    shortDesc: 'Xóa vĩnh viễn hồ sơ',
    description: 'Cho phép xóa bỏ hồ sơ định giá khỏi hệ thống dữ liệu làm việc.'
  },
  {
    key: 'update_status',
    label: 'Cập nhật trạng thái quy trình',
    category: 'dossier',
    shortDesc: 'Chuyển đổi trạng thái SLA',
    description: 'Cho phép thay đổi trạng thái tiến độ hồ sơ (Khảo sát, Chờ duyệt, Đã duyệt, Gửi chi nhánh, Hủy...).'
  },

  // 2. Báo cáo & Nhập/Xuất
  {
    key: 'export_report',
    label: 'Xuất Báo cáo định giá (3 mẫu Drive)',
    category: 'export_import',
    shortDesc: 'Xuất 3 mẫu báo cáo BAC A AMC',
    description: 'Tạo và xuất Báo cáo kết quả tư vấn, Thông báo kết quả và Thông báo phí theo 3 mẫu chuẩn Google Drive (Word .docx, In/PDF).'
  },
  {
    key: 'export_excel',
    label: 'Xuất danh sách ra Excel',
    category: 'export_import',
    shortDesc: 'Tải tệp .xlsx danh sách',
    description: 'Cho phép trích xuất toàn bộ hoặc danh sách hồ sơ sau khi lọc ra file bảng tính Microsoft Excel.'
  },
  {
    key: 'import_excel',
    label: 'Nhập dữ liệu Excel / Google Sheets',
    category: 'export_import',
    shortDesc: 'Nạp dữ liệu hàng loạt',
    description: 'Cho phép nhập danh sách hồ sơ hàng loạt từ file Excel (.xlsx) hoặc sao chép bảng Google Sheets.'
  },

  // 3. Giao diện & Công cụ
  {
    key: 'view_kanban',
    label: 'Xem quy trình Kanban',
    category: 'tools',
    shortDesc: 'Bảng luân chuyển Kanban',
    description: 'Cho phép theo dõi luồng công việc trực quan theo từng giai đoạn trên bảng Kanban tương tác.'
  },
  {
    key: 'view_dashboard',
    label: 'Thống kê KPI & Biểu đồ',
    category: 'tools',
    shortDesc: 'Báo cáo số liệu tổng hợp',
    description: 'Cho phép truy cập trang thống kê doanh thu phí dịch vụ, tỷ lệ hoàn thành SLA và cơ cấu tài sản.'
  },
  {
    key: 'use_ai_assistant',
    label: 'Sử dụng Trợ lý AI Thẩm định',
    category: 'tools',
    shortDesc: 'Trợ lý AI Gemini hỗ trợ',
    description: 'Cho phép sử dụng Trợ lý AI hỗ trợ tóm tắt hồ sơ, gợi ý phương pháp so sánh và phân tích giá thị trường.'
  },

  // 4. Quản trị hệ thống
  {
    key: 'reset_data',
    label: 'Khôi phục dữ liệu mẫu',
    category: 'admin',
    shortDesc: 'Reset cơ sở dữ liệu mẫu',
    description: 'Cho phép hoàn tác dữ liệu hệ thống về bộ dữ liệu thẩm định mẫu tiêu chuẩn ban đầu.'
  },
  {
    key: 'manage_permissions',
    label: 'Phân quyền & Quản lý Người dùng',
    category: 'admin',
    shortDesc: 'Quản trị viên phân quyền',
    description: 'Đặc quyền dành riêng cho Admin để thêm/sửa user và cấu hình chi tiết phân quyền cho từng tài khoản.'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, FeaturePermissionKey[]> = {
  ADMIN: [
    'create_dossier',
    'edit_dossier',
    'delete_dossier',
    'update_status',
    'export_report',
    'export_excel',
    'import_excel',
    'view_kanban',
    'view_dashboard',
    'use_ai_assistant',
    'reset_data',
    'manage_permissions'
  ],
  MANAGER: [
    'create_dossier',
    'edit_dossier',
    'delete_dossier',
    'update_status',
    'export_report',
    'export_excel',
    'import_excel',
    'view_kanban',
    'view_dashboard',
    'use_ai_assistant'
  ],
  APPRAISER: [
    'create_dossier',
    'edit_dossier',
    'update_status',
    'export_report',
    'export_excel',
    'view_kanban',
    'use_ai_assistant'
  ],
  STAFF: [
    'create_dossier',
    'view_kanban',
    'export_excel'
  ]
};

export const ROLE_INFO: Record<UserRole, { label: string; badge: string; description: string }> = {
  ADMIN: {
    label: 'Quản trị viên Hệ thống',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Toàn quyền cấu hình, phân quyền tính năng cho user và quản trị dữ liệu'
  },
  MANAGER: {
    label: 'Trưởng phòng Thẩm định',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Duyệt báo cáo, quản lý phân công hồ sơ và xem thống kê kinh doanh'
  },
  APPRAISER: {
    label: 'Chuyên viên Thẩm định',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Khảo sát thực địa, lập tờ trình và xuất báo cáo kết quả tư vấn'
  },
  STAFF: {
    label: 'Nhân viên Tiếp nhận',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Tiếp nhận hồ sơ ban đầu, kiểm tra hồ sơ pháp lý sơ bộ'
  }
};

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  department: string;
  avatarUrl?: string;
  phone?: string;
  permissions?: FeaturePermissionKey[]; // Explicit feature permissions granted to this user
}

export const MOCK_USERS: User[] = [
  {
    id: 'usr-003',
    username: 'tranthithu',
    name: 'Trần Thị Thu',
    email: 'thu.tran@valumanager.vn',
    role: 'ADMIN',
    roleName: 'Quản trị viên Hệ thống',
    department: 'Ban Giám đốc',
    phone: '0988 999 888',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.ADMIN]
  },
  {
    id: 'usr-001',
    username: 'nguyenminhhai',
    name: 'Nguyễn Minh Hải',
    email: 'hai.nguyen@valumanager.vn',
    role: 'MANAGER',
    roleName: 'Trưởng phòng Thẩm định',
    department: 'Phòng Thẩm định 1',
    phone: '0903 123 456',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.MANAGER]
  },
  {
    id: 'usr-002',
    username: 'levannam',
    name: 'Lê Văn Nam',
    email: 'nam.le@valumanager.vn',
    role: 'APPRAISER',
    roleName: 'Chuyên viên Thẩm định',
    department: 'Phòng Thẩm định 1',
    phone: '0912 345 678',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.APPRAISER]
  },
  {
    id: 'usr-004',
    username: 'hoangminhvuong',
    name: 'Hoàng Minh Vương',
    email: 'vuong.hoang@valumanager.vn',
    role: 'APPRAISER',
    roleName: 'Chuyên viên Thẩm định',
    department: 'Phòng Thẩm định 2',
    phone: '0934 567 890',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.APPRAISER]
  }
];
