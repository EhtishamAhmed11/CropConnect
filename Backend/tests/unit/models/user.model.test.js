import User from '../../../models/user.model.js';
import { createTestUser } from '../../helpers/testHelpers.js';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123',
        fullName: 'Test User',
        role: 'government_policy_maker',
      };

      const user = await User.create(userData);

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('government_policy_maker');
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
    });

    it('should reject user without required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should reject duplicate email', async () => {
      await User.create({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
        fullName: 'User One',
        role: 'ngo_coordinator',
      });

      await expect(
        User.create({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password456',
          fullName: 'User Two',
          role: 'distributor',
        })
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        role: 'admin',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should reject invalid role', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'invalid_role',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should set default preferences', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'government_policy_maker',
      });

      expect(user.preferences.emailNotifications).toBe(true);
      expect(user.preferences.inAppNotifications).toBe(true);
      expect(user.preferences.reportFrequency).toBe('weekly');
    });

    it('should validate phone number format', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'distributor',
        phoneNumber: '123', // Invalid - too short
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    it('should increment login attempts', async () => {
      const user = await createTestUser();
      
      user.loginAttempts += 1;
      await user.save();

      expect(user.loginAttempts).toBe(1);
    });

    it('should lock account after multiple failed attempts', async () => {
      const user = await createTestUser();
      
      user.loginAttempts = 5;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      expect(user.lockUntil).toBeDefined();
      expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
    });
  });
});