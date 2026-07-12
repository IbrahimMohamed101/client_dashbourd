# 🖥️ Auth Changes Needed — Admin Dashboard

> **Last Reviewed:** 2026-07-12  
> **Status:** UI Changes Required (backend already fixed)

---

## ✅ Backend Already Fixed

The following backend changes were made to `src/controllers/adminController.js`:

| Endpoint | Old Behavior | New Behavior |
|---|---|---|
| `POST /api/dashboard/users` | Creates user with no password, `accountStatus: "pending_activation"` | **Requires** `password` (min 6 chars), hashes it, sets `forcePasswordChange: true`, `accountStatus: "active"` |
| `POST /api/dashboard/users/:id/reset-password` | Cleared password hash, set `accountStatus: "reset_requested"` | **Requires** `password` (min 6 chars), hashes it, sets `forcePasswordChange: true`, `accountStatus: "active"` |
| `GET /api/dashboard/users` / `GET /api/dashboard/users/:id` | Did not return `forcePasswordChange` or `accountStatus` | Now returns both `accountStatus` and `forcePasswordChange` fields |

---

## ❌ Change Required 1: Create User Form — Add Temporary Password Field

### Location
`src/components/pages/users/create-user-form.tsx`  
`src/lib/validations/createUserSchema.ts`  
`src/hooks/useCreateUserForm.ts`

### Problem
The current create user form collects only: Full Name, Phone, Email, isActive. The backend now **requires** a `password` field.

### Required Fix — `createUserSchema.ts`

Add `password` field to the Zod schema:

```typescript
// src/lib/validations/createUserSchema.ts
import { z } from "zod";

const createUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "الاسم الكامل مطلوب")
    .min(3, "يجب أن يكون الاسم 3 أحرف على الأقل"),
  phoneE164: z
    .string()
    .min(1, "رقم الهاتف مطلوب")
    .regex(
      /^\+9665\d{8}$/,
      "يجب أن يكون رقم الهاتف بصيغة جوال سعودي صحيحة (مثال: +966500000000)"
    ),
  email: z
    .string()
    .email("عنوان البريد الإلكتروني غير صالح")
    .optional()
    .or(z.literal("")),
  // NEW FIELD:
  password: z
    .string()
    .min(6, "كلمة المرور المؤقتة يجب أن تكون 6 أحرف على الأقل")
    .min(1, "كلمة المرور المؤقتة مطلوبة"),
  isActive: z.boolean(),
});

export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export default createUserSchema;
```

### Required Fix — `useCreateUserForm.ts`

Add `password` default value:

```typescript
// src/hooks/useCreateUserForm.ts
const useCreateUserForm = () => {
  const form = useForm<CreateUserSchemaType>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      phoneE164: "+966",
      email: "",
      password: "",      // NEW
      isActive: true,
    },
  });

  return form;
};
```

### Required Fix — `create-user-form.tsx`

Add password field to the form UI (insert after the `phoneE164` field):

```tsx
{/* Add after the phoneE164 Field block */}
<Field>
  <FieldLabel htmlFor="password">
    كلمة المرور المؤقتة
  </FieldLabel>
  <Input
    id="password"
    type="password"
    dir="ltr"
    placeholder="أدخل كلمة مرور مؤقتة"
    {...register("password")}
    aria-invalid={errors.password ? "true" : "false"}
    className="text-left"
  />
  {errors.password && (
    <p className="mt-1 text-sm text-destructive">
      {errors.password.message}
    </p>
  )}
  <p className="mt-1 text-xs text-muted-foreground">
    سيُطلب من المستخدم تغيير هذه الكلمة عند أول تسجيل دخول.
  </p>
</Field>
```

---

## ❌ Change Required 2: User Detail Page — Add Reset Password Button with Password Input

### Location
`src/routes/_protected/users/$userId/index.tsx`

### Problem
The user detail page has no way for the admin to reset the user's password. The backend endpoint `POST /api/dashboard/users/:id/reset-password` now requires a `password` body parameter.

### Required Fix

Add a "Reset Password" section to the user detail page:

```tsx
// Add this import at the top
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/apis";

// Add this component inside UserDetailsPage or as a separate card:
function ResetPasswordCard({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const resetPassword = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/dashboard/users/${userId}/reset-password`, {
        password,
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      setPassword("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
      // Show success toast
      ToastMessage("تم إعادة تعيين كلمة المرور بنجاح", "success");
    },
    onError: (error: unknown) => {
      ToastMessage(getApiErrorMessage(error) || "حدث خطأ أثناء إعادة تعيين كلمة المرور", "error");
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4" />
          إعادة تعيين كلمة المرور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          أدخل كلمة مرور مؤقتة للمستخدم. سيُطلب منه تغييرها عند أول تسجيل دخول.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">كلمة المرور المؤقتة</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2 text-sm"
            dir="ltr"
            placeholder="أدخل كلمة مرور مؤقتة (6 أحرف على الأقل)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">سبب الإعادة (اختياري)</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="سبب إعادة التعيين"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button
          variant="destructive"
          disabled={password.length < 6 || resetPassword.isPending}
          onClick={() => resetPassword.mutate()}
          className="w-full"
        >
          {resetPassword.isPending ? "جاري الإعادة..." : "إعادة تعيين كلمة المرور"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

Add `<ResetPasswordCard userId={userId} />` inside the `UserDetailsPage` grid section.

---

## ❌ Change Required 3: User Detail Page — Show `forcePasswordChange` Status Badge

### Location
`src/routes/_protected/users/$userId/index.tsx` (Account Info card, lines 122–138)

### Problem
The API now returns `forcePasswordChange` and `accountStatus` for each user, but the UI doesn't display them.

### Required Fix

Add these two items inside the "معلومات الحساب" (Account Info) card:

```tsx
{/* Add after the existing الحالة div */}
{user.forcePasswordChange && (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">كلمة المرور</span>
    <Badge variant="outline" className="text-amber-600 border-amber-400">
      مؤقتة — بانتظار التغيير
    </Badge>
  </div>
)}
<div className="flex items-center justify-between text-sm">
  <span className="text-muted-foreground">حالة الحساب</span>
  <Badge variant="outline">{user.accountStatus || "active"}</Badge>
</div>
```

---

## 🔁 Complete Admin Flow Summary (After Fix)

```
Admin navigates to /users/create
  → Fills: Full Name, Phone, Email (optional), Temporary Password, isActive
  → Clicks "إنشاء المستخدم"
  → Backend: hash(password), forcePasswordChange=true, accountStatus=active
  → User is created. Admin communicates temporary password to user via phone/WhatsApp.

User logs into mobile app with temporary password
  → App detects forcePasswordChange=true → redirect to change password screen
  → User sets permanent password
  → forcePasswordChange = false ✅

Admin needs to reset a user's password:
  → Navigate to /users/:userId
  → Use "إعادة تعيين كلمة المرور" card
  → Enter a new temporary password + optional reason
  → Click "إعادة تعيين"
  → Backend: hash(password), forcePasswordChange=true
  → Admin communicates temporary password to user
```

---

## 📋 API Contract Reference

### `POST /api/dashboard/users` — Create User
```json
// Request body (UPDATED — password is now required):
{
  "phone": "+966500000000",      // required
  "password": "Temp1234",        // required (min 6 chars) — NEW
  "fullName": "أحمد محمد",      // optional
  "email": "user@example.com",   // optional
  "isActive": true               // optional, default true
}

// Response 201:
{
  "status": true,
  "data": {
    "id": "...",
    "phone": "+966500000000",
    "accountStatus": "active",
    "forcePasswordChange": true   // NEW field
  }
}

// Error 400 (missing/short password):
{
  "status": false,
  "code": "INVALID",
  "message": "A temporary password (minimum 6 characters) is required when creating a user"
}
```

### `POST /api/dashboard/users/:id/reset-password` — Reset Password
```json
// Request body (UPDATED — password is now required):
{
  "password": "NewTemp5678",    // required (min 6 chars) — NEW
  "reason": "User forgot password"  // optional
}

// Response 200:
{
  "status": true,
  "message": "Password reset successfully. User will be prompted to change it on next login.",
  "data": {
    "userId": "...",
    "accountStatus": "active",
    "forcePasswordChange": true
  }
}
```
