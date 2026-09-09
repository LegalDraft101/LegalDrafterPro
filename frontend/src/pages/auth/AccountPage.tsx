import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge, Button, Card, Divider, Input, Spinner, Title2 } from '@fluentui/react-components';
import { linkWithPhoneNumber, RecaptchaVerifier, type ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api';
import type { ProfileResponse } from '../../api/types';
import { usePageStyles } from './authStyles';
import { auth } from '../../lib/firebase';

type VerificationChannel = 'email' | 'phone';
type AddressKind = 'personal' | 'delivery';
const emptyAddress = { addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'home', name: '', phone: '', pincode: '' };

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const p = usePageStyles();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileEditing, setProfileEditing] = useState(true);
  const [preferences, setPreferences] = useState<ProfileResponse['preferences']>({ language: 'en', theme: 'System', emailNotifications: true, marketingEmails: false, whatsappEnabled: false, smsNotifications: false });
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState<{ channel: VerificationChannel; otpId?: string } | null>(null);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneRecaptcha, setPhoneRecaptcha] = useState<RecaptchaVerifier | null>(null);
  const [code, setCode] = useState('');
  const [addressFormKind, setAddressFormKind] = useState<AddressKind | null>(null);
  const [address, setAddress] = useState(emptyAddress);
  const [editingAddress, setEditingAddress] = useState<{ id: string; kind: AddressKind } | null>(null);

  const loadProfile = async () => {
    try { const result = await api.profile(); setProfile(result); setFirstName(result.user.firstName || ''); setLastName(result.user.lastName || ''); setDisplayName(result.user.displayName || result.user.name); setName(result.user.name); setJobTitle(result.profile.jobTitle); setAvatar(result.profile.avatar); setEmail(result.user.email || ''); setPhone(result.user.phone || ''); setPreferences(result.preferences); }
    catch (error: any) { toast.error(error.message || 'Could not load profile.'); }
  };

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in.');
      navigate('/login');
    }
    if (user) void loadProfile();
  }, [loading, user, navigate]);

  if (loading || (user && !profile)) return <div className={p.accountWrapper}><Card className={p.accountCard}><Spinner label="Loading profile…" /></Card></div>;
  if (!user || !profile) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { await api.updateProfile({ name: name.trim(), firstName: firstName.trim(), lastName: lastName.trim(), displayName: displayName.trim(), jobTitle: jobTitle.trim(), avatar: avatar.trim(), preferences }); await loadProfile(); setProfileEditing(false); toast.success('Profile updated.'); }
    catch (error: any) { toast.error(error.message || 'Could not update profile.'); } finally { setSaving(false); }
  };

  const requestVerification = async (channel: VerificationChannel) => {
    const mobile = phone.replace(/\D/g, '');
    if (channel === 'phone' && mobile.length !== 10) { toast.error('Enter a valid 10-digit mobile number.'); return; }
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Enter a valid email address.'); return; }

    setVerification(null);
    setPhoneConfirmation(null);
    setCode('');

    try {
      if (channel === 'phone') {
        if (!auth.currentUser) throw new Error('Firebase sign-in is required for phone verification.');
        const verifier = phoneRecaptcha ?? new RecaptchaVerifier(auth, 'phone-recaptcha', { size: 'invisible' });
        if (!phoneRecaptcha) setPhoneRecaptcha(verifier);
        const confirmation = await linkWithPhoneNumber(auth.currentUser, `+91${mobile}`, verifier);
        setPhoneConfirmation(confirmation);
        setVerification({ channel });
      } else {
        const result = await api.requestVerification({ channel, email: email.trim() });
        setVerification({ channel, otpId: result.otpId });
      }
      toast.success(`Verification code sent to your ${channel}.`);
    }
    catch (error: any) { toast.error(error.message || `Could not send ${channel} verification code.`); }
  };

  const verifyContact = async (event?: FormEvent) => {
    event?.preventDefault(); if (!verification) return;
    try {
      if (verification.channel === 'phone') {
        if (!phoneConfirmation) throw new Error('Request a phone verification code first.');
        await phoneConfirmation.confirm(code);
        await auth.currentUser?.getIdToken(true);
        await api.syncFirebasePhone();
      } else {
        await api.verifyContact({ channel: verification.channel, otpId: verification.otpId || '', code });
      }
      const channel = verification.channel; setVerification(null); setPhoneConfirmation(null); setCode(''); await loadProfile(); toast.success(`${channel === 'email' ? 'Email' : 'Phone'} verified.`);
    }
    catch (error: any) { toast.error(error.message || 'Invalid verification code.'); }
  };

  const addAddress = async (event: FormEvent, kind: AddressKind) => {
    event.preventDefault();
    try {
      const body = { ...address, kind, ...(kind === 'personal' ? { isPrimary: true } : { pincode: address.pincode || address.postalCode }) };
      if (editingAddress) await api.updateAddress(editingAddress.id, body);
      else await api.addAddress(body);
      const wasEditing = Boolean(editingAddress); setAddress(emptyAddress); setEditingAddress(null); setAddressFormKind(null); await loadProfile(); toast.success(wasEditing ? 'Address updated.' : 'Address saved.');
    }
    catch (error: any) { toast.error(error.message || 'Could not save address.'); }
  };

  const removeAddress = async (id: string, kind: AddressKind) => {
    try { await api.deleteAddress(id, kind); setAddressFormKind(null); await loadProfile(); toast.success('Address removed.'); }
    catch (error: any) { toast.error(error.message || 'Could not remove address.'); }
  };

  const editAddress = (item: any, kind: AddressKind) => {
    setAddressFormKind(kind);
    setEditingAddress({ id: item.id, kind });
    setAddress({
      addressLine1: item.addressLine1 || '', addressLine2: item.addressLine2 || '', city: item.city || '', state: item.state || '',
      postalCode: item.postalCode || '', country: item.country || 'India', addressType: item.addressType || 'home',
      name: item.name || '', phone: item.phone || '', pincode: item.pincode || '',
    });
  };

  const setDefaultAddress = async (id: string, kind: AddressKind) => {
    try { setProfile(await api.setDefaultAddress(id, kind)); toast.success('Default address updated.'); }
    catch (error: any) { toast.error(error.message || 'Could not update the default address.'); }
  };

  const openAddressForm = (kind: AddressKind) => {
    setAddressFormKind(kind);
    setEditingAddress(null);
    setAddress(emptyAddress);
  };

  const field = (label: string, key: keyof typeof emptyAddress, required = true) => <label className={p.profileField}><span>{label}</span><Input value={address[key]} required={required} onChange={(_, data) => setAddress((current) => ({ ...current, [key]: data.value }))} /></label>;

  const addressFormFields = addressFormKind === 'personal'
    ? <>{field('Address line 1', 'addressLine1')}{field('Address line 2', 'addressLine2', false)}<div className={p.addressGrid}>{field('City', 'city')}{field('State', 'state')}{field('Postal code', 'postalCode')}{field('Country', 'country')}</div></>
    : <>{field('Recipient name', 'name')}{field('Recipient phone', 'phone')}{field('Address line 1', 'addressLine1')}{field('Address line 2', 'addressLine2', false)}<div className={p.addressGrid}>{field('City', 'city')}{field('State', 'state')}{field('Pincode', 'pincode')}{field('Country', 'country')}</div></>;

  const closeAddressForm = () => { setAddressFormKind(null); setEditingAddress(null); setAddress(emptyAddress); };

  const verificationCodeForm = (channel: VerificationChannel) => verification?.channel === channel ? (
    <div className={p.otpForm}>
      <Input value={code} onChange={(_, data) => setCode(data.value)} placeholder={`Enter ${channel} OTP`} inputMode="numeric" maxLength={6} required />
      <div className={p.contactInputRow}>
        <Button type="button" appearance="primary" onClick={() => void verifyContact()}>Verify {channel}</Button>
        <Button type="button" appearance="subtle" onClick={() => { setVerification(null); setPhoneConfirmation(null); setCode(''); }}>Cancel</Button>
      </div>
    </div>
  ) : null;
  const initials = (displayName || name || 'User').split(/\s+/).map((part) => part[0]).join('').toUpperCase().slice(0, 2);

  return <div className={p.accountWrapper}><div className={p.profileLayout}>
    <Card className={p.profileCard}><div className={p.profileHeader}><div className={p.profileIdentity}><span className={p.profileAvatar}>{initials}</span><div><span className={p.profileEyebrow}>Account profile</span><Title2 className={p.accountHeading}>My Profile</Title2><p className={p.profileMuted}>Manage your account details and verification status.</p></div></div><Button appearance="outline" onClick={() => logout()}>Logout</Button></div><div id="phone-recaptcha" aria-hidden="true" />
      {profileEditing ? <form onSubmit={saveProfile} className={p.profileForm}>
        <div className={p.profileGrid}><label className={p.profileField}><span>First name</span><Input value={firstName} onChange={(_, data) => setFirstName(data.value)} required /></label><label className={p.profileField}><span>Last name</span><Input value={lastName} onChange={(_, data) => setLastName(data.value)} /></label></div>
        <label className={p.profileField}><span>Display name</span><Input value={displayName} onChange={(_, data) => setDisplayName(data.value)} /></label>
        <label className={p.profileField}><span>Full name</span><Input value={name} onChange={(_, data) => setName(data.value)} required /></label>
        <div className={p.profileGrid}><label className={p.profileField}><span>Job title</span><Input value={jobTitle} onChange={(_, data) => setJobTitle(data.value)} /></label><label className={p.profileField}><span>Avatar URL</span><Input value={avatar} onChange={(_, data) => setAvatar(data.value)} /></label></div>
        <div className={p.profileField}><span>Email</span><div className={p.contactInputRow}><Input value={email} placeholder="Enter your email address" type="email" disabled={profile.verification.emailVerified} onChange={(_, data) => setEmail(data.value)} />{!profile.verification.emailVerified && <Button type="button" size="small" onClick={() => requestVerification('email')}>Verify</Button>}</div>{verificationCodeForm('email')}</div>
        <div className={p.profileField}><span>Phone</span><div className={p.contactInputRow}><Input value={phone} placeholder="Enter your 10-digit mobile number" type="tel" minLength={10} maxLength={10} pattern="[0-9]{10}" disabled={profile.verification.phoneVerified} onChange={(_, data) => setPhone(data.value.replace(/\D/g, '').slice(0, 10))} />{!profile.verification.phoneVerified && <Button type="button" size="small" onClick={() => requestVerification('phone')}>Verify</Button>}</div>{verificationCodeForm('phone')}</div>
        <Divider /><h3>Preferences</h3>
        <label className={p.preferenceRow}><input type="checkbox" checked={preferences.emailNotifications} onChange={(event) => setPreferences((current) => ({ ...current, emailNotifications: event.target.checked }))} /> Email notifications</label>
        <label className={p.preferenceRow}><input type="checkbox" checked={preferences.marketingEmails} onChange={(event) => setPreferences((current) => ({ ...current, marketingEmails: event.target.checked }))} /> Marketing emails</label>
        <label className={p.preferenceRow}><input type="checkbox" checked={preferences.whatsappEnabled} onChange={(event) => setPreferences((current) => ({ ...current, whatsappEnabled: event.target.checked }))} /> WhatsApp notifications</label>
        <label className={p.preferenceRow}><input type="checkbox" checked={preferences.smsNotifications} onChange={(event) => setPreferences((current) => ({ ...current, smsNotifications: event.target.checked }))} /> SMS notifications</label>
        <Button type="submit" appearance="primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
      </form> : <section className={p.profileSection}>
        <div className={p.profileSummary}><div><strong>{displayName || name}</strong><span>{jobTitle || 'No job title provided'}</span></div><Button type="button" appearance="outline" onClick={() => setProfileEditing(true)}>Edit profile</Button></div>
        <dl className={p.accountDl}><dt>First name</dt><dd>{firstName || '—'}</dd><dt>Last name</dt><dd>{lastName || '—'}</dd><dt>Email</dt><dd>{email || 'Not provided'}</dd><dt>Phone</dt><dd>{phone || 'Not provided'}</dd><dt>Account status</dt><dd>{profile.user.accountStatus || 'Active'}</dd></dl>
      </section>}
      <Divider /><section className={p.profileSection}><h3>Contact verification</h3><div className={p.verificationRow}><span>Email <Badge appearance={profile.verification.emailVerified ? 'filled' : 'outline'} color={profile.verification.emailVerified ? 'success' : 'informative'}>{profile.verification.emailVerified ? 'Verified' : 'Not verified'}</Badge></span></div><div className={p.verificationRow}><span>Phone <Badge appearance={profile.verification.phoneVerified ? 'filled' : 'outline'} color={profile.verification.phoneVerified ? 'success' : 'informative'}>{profile.verification.phoneVerified ? 'Verified' : 'Not verified'}</Badge></span></div></section>
    </Card>
    <Card className={p.profileCard}><section className={p.profileSection}><h3>Saved addresses</h3>{[...profile.addresses.map((item) => ({ ...item, kind: 'personal' as const, label: `Personal (${profile.user.name})` })), ...profile.deliveryAddresses.map((item) => ({ ...item, kind: 'delivery' as const, label: item.name }))].map((item) => <div className={p.addressRow} key={`${item.kind}-${item.id}`}><div><strong>{item.label}</strong><p>{item.addressLine1}, {item.city}, {item.state} {item.kind === 'personal' ? item.postalCode : item.pincode}</p><div className={p.addressActions}><Badge appearance={(item.kind === 'personal' ? item.isPrimary : item.isDefault) ? 'filled' : 'outline'} color="informative">{(item.kind === 'personal' ? item.isPrimary : item.isDefault) ? 'Default' : 'Make default'}</Badge><Button size="small" appearance="subtle" onClick={() => editAddress(item, item.kind)}>Edit</Button>{!(item.kind === 'personal' ? item.isPrimary : item.isDefault) && <Button size="small" appearance="subtle" onClick={() => setDefaultAddress(item.id, item.kind)}>Set default</Button>}<Button size="small" appearance="subtle" onClick={() => removeAddress(item.id, item.kind)}>Remove</Button></div></div></div>)}{!profile.addresses.length && !profile.deliveryAddresses.length && <p className={p.profileMuted}>No saved addresses yet.</p>}</section><Divider />{!addressFormKind && <div className={p.addressActions}>{!profile.addresses.length && <Button type="button" appearance="primary" onClick={() => openAddressForm('personal')}>Set personal address</Button>}<Button type="button" appearance="outline" onClick={() => openAddressForm('delivery')}>Add delivery address</Button></div>}{addressFormKind && <section className={p.profileSection}><div className={p.addressTypeRow}>{(!profile.addresses.length || editingAddress?.kind === 'personal') && <Button type="button" size="small" appearance={addressFormKind === 'personal' ? 'primary' : 'outline'} onClick={() => openAddressForm('personal')}>Personal address</Button>}<Button type="button" size="small" appearance={addressFormKind === 'delivery' ? 'primary' : 'outline'} onClick={() => openAddressForm('delivery')}>Delivery address</Button></div><form onSubmit={(event) => void addAddress(event, addressFormKind)} className={p.addressForm}>{addressFormFields}<div className={p.addressActions}><Button type="submit" appearance="primary">{editingAddress ? 'Update address' : addressFormKind === 'personal' ? 'Save personal address' : 'Save delivery address'}</Button><Button type="button" onClick={closeAddressForm}>Cancel</Button></div></form></section>}</Card>
  </div></div>;
}
