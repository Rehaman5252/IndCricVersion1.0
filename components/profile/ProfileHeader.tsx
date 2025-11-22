// app/components/profile/ProfileHeader.tsx
'use client';

import React, { memo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { calculateAge, maskPhone } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { PhoneVerificationDialog } from './PhoneVerificationDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { normalizeTimestamp } from '@/lib/dates';

function ProfileHeaderComponent({ userProfile }: { userProfile: any }) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    
    const dobDate = normalizeTimestamp(userProfile?.dob);
    const age = dobDate ? calculateAge(dobDate.toISOString().split('T')[0]) : null;
    
    const isPhoneVerified = !!profile?.phoneVerified;
    const isEmailVerified = user?.emailVerified || false;

    const handleResendVerification = async () => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        try {
            await sendEmailVerification(user);
            toast({ title: 'Verification Email Sent', description: 'Please check your inbox to verify your email address.' });
        } catch (error: any) {
            console.error("Error resending verification email:", error);
            let message = "Could not send verification email.";
            if (error?.code === 'auth/too-many-requests') {
                message = "You've requested this too many times. Please wait before trying again.";
            }
            toast({ title: 'Error', description: message, variant: 'destructive' });
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <Card className="bg-card shadow-lg relative">
            {user && profile && (
                <div className="absolute top-2 right-2 z-10">
                    <EditProfileDialog userProfile={profile}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-card border-primary text-primary hover:bg-primary/10 hover:text-primary h-8 w-8"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    </EditProfileDialog>
                </div>
            )}
            <CardContent className="p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage
                        src={userProfile?.photoURL || `https://placehold.co/100x100.png`}
                        alt="User Avatar"
                        data-ai-hint="avatar person"
                    />
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.name || 'New User'}</h2>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <p className="text-muted-foreground text-sm">{maskPhone(userProfile?.phone)}</p>
                        {userProfile.phone ? (
                            isPhoneVerified ? (
                                // use aria-label for accessibility
                                <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Phone Verified" />
                            ) : (
                                <PhoneVerificationDialog phone={userProfile.phone}>
                                    <Button variant="link" className="p-0 h-auto text-yellow-500 text-sm hover:no-underline">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        Verify Now
                                    </Button>
                                </PhoneVerificationDialog>
                            )
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                        {userProfile?.email && (
                            isEmailVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Email Verified" />
                            ) : (
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-yellow-500 text-sm hover:no-underline"
                                    onClick={handleResendVerification}
                                >
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Resend Link
                                </Button>
                            )
                        )}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {age ? <span>{age} yrs</span> : null}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const ProfileHeader = memo(ProfileHeaderComponent);
export default ProfileHeader;
