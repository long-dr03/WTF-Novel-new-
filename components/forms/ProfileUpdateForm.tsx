"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AvatarUpload } from "@/components/ui/AvatarUpload"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

interface ProfileUpdateFormProps {
    defaultValues?: Partial<ProfileUpdateFormData>
    onSubmit: (data: ProfileUpdateFormData) => void
}

export function ProfileUpdateForm({ defaultValues, onSubmit }: ProfileUpdateFormProps) {
    const form = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            username: defaultValues?.username || "",
            email: defaultValues?.email || "",
            avatar: undefined,
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên hiển thị</FormLabel>
                            <FormControl>
                                <Input placeholder="Nguyễn Văn A" {...field} />
                            </FormControl>
                            <FormDescription>
                                Tên này sẽ hiển thị công khai trên trang cá nhân của bạn.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="example@email.com" {...field} />
                            </FormControl>
                            <FormDescription>
                                Email của bạn sẽ được sử dụng để đăng nhập và nhận thông báo.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Avatar</FormLabel>
                            <FormControl>
                                <AvatarUpload
                                    value={value}
                                    defaultPreview={defaultValues?.avatar || value}
                                    onChange={(url) => onChange(url)}
                                    onError={(error: string) => {
                                        form.setError('avatar', { message: error })
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                Chọn hình ảnh đại diện của bạn (tối đa 5MB).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu (Tùy chọn)</h3>

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu cũ</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu mới</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Mật khẩu phải có ít nhất 6 ký tự.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full">
                    Lưu thay đổi
                </Button>
            </form>
        </Form>
    )
}
