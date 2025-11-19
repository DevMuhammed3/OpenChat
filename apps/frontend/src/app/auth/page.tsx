'use client'
const API_URL = 'http://localhost:4000/auth'
import React, { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from 'packages/ui'
import { Input } from 'packages/ui'
import { Button } from 'packages/ui'
import { Label } from 'packages/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'packages/ui'
import { Alert, AlertDescription } from 'packages/ui'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from 'lucide-react'

export default function AuthPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [activeTab, setActiveTab] = useState('login')
    const [message, setMessage] = useState({ type: '', text: '' })
    const [loginData, setLoginData] = useState({ email: '', password: '' })
    const [signupData, setSignupData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (!loginData.email || !loginData.password) {
            setMessage({ type: 'error', text: 'Please fill in all fields' })
            return
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            })

            const data = await res.json()

            if (!res.ok) {
                setMessage({
                    type: 'error',
                    text: data.message || 'Login failed',
                })
                return
            }

            // Save token
            localStorage.setItem('token', data.token)

            setMessage({ type: 'success', text: 'Login successful!' })
            setTimeout(() => {
                window.location.href = '/chat'
            }, 1000)
        } catch (err) {
            setMessage({ type: 'error', text: 'Something went wrong' })
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (
            !signupData.name ||
            !signupData.username ||
            !signupData.email ||
            !signupData.password
        ) {
            setMessage({ type: 'error', text: 'Please fill in all fields' })
            return
        }

        if (signupData.password !== signupData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' })
            return
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: signupData.name,
                    username: signupData.username,
                    email: signupData.email,
                    password: signupData.password,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setMessage({
                    type: 'error',
                    text: data.message || 'Signup failed',
                })
                return
            }

            setMessage({
                type: 'success',
                text: 'Account created successfully!',
            })

            setTimeout(() => {
                setActiveTab('login')
                setMessage({ type: '', text: '' })
            }, 1500)
        } catch (err) {
            setMessage({ type: 'error', text: 'Something went wrong' })
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-bold tracking-tight">
                        Welcome
                    </h1>
                    <p className="text-muted-foreground">
                        Sign in to your account or create a new one
                    </p>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="mb-4 grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                        {message.text && (
                            <Alert
                                className={`${
                                    message.type === 'success'
                                        ? 'border-green-500/50 bg-green-500/10 text-green-500'
                                        : 'border-destructive/50 bg-destructive/10 text-destructive'
                                }`}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    {message.text}
                                </AlertDescription>
                            </Alert>
                        )}

                    <TabsContent value="login">
                        <Card>
                            <CardHeader>
                                <CardTitle>Login</CardTitle>
                                <CardDescription>
                                    Enter your credentials to access your
                                    account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-10"
                                            value={loginData.email}
                                            onChange={(e) =>
                                                setLoginData({
                                                    ...loginData,
                                                    email: e.target.value,
                                                })
                                            }
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                handleLogin(e)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="login-password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            placeholder="••••••••"
                                            className="px-10"
                                            value={loginData.password}
                                            onChange={(e) =>
                                                setLoginData({
                                                    ...loginData,
                                                    password: e.target.value,
                                                })
                                            }
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                handleLogin(e)
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleLogin}
                                    className="w-full"
                                >
                                    Login
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create an account</CardTitle>
                                <CardDescription>
                                    Enter your information to get started
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">
                                        Full Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-name"
                                            type="text"
                                            placeholder="John Doe"
                                            className="pl-10"
                                            value={signupData.name}
                                            onChange={(e) =>
                                                setSignupData({
                                                    ...signupData,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">
                                        Username
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-username"
                                            type="text"
                                            placeholder="z3i8"
                                            className="pl-10"
                                            value={signupData.username}
                                            onChange={(e) =>
                                                setSignupData({
                                                    ...signupData,
                                                    username: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-10"
                                            value={signupData.email}
                                            onChange={(e) =>
                                                setSignupData({
                                                    ...signupData,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            placeholder="••••••••"
                                            className="px-10"
                                            value={signupData.password}
                                            onChange={(e) =>
                                                setSignupData({
                                                    ...signupData,
                                                    password: e.target.value,
                                                })
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirm-password">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="signup-confirm-password"
                                            type={
                                                showConfirmPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            placeholder="••••••••"
                                            className="px-10"
                                            value={signupData.confirmPassword}
                                            onChange={(e) =>
                                                setSignupData({
                                                    ...signupData,
                                                    confirmPassword:
                                                        e.target.value,
                                                })
                                            }
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                handleSignup(e)
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleSignup}
                                    className="w-full"
                                >
                                    Create Account
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>By creating an account, you agree to our</p>
                    <div className="space-x-1">
                        <button className="text-primary hover:underline">
                            Terms of Service
                        </button>
                        <span>and</span>
                        <button className="text-primary hover:underline">
                            Privacy Policy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}