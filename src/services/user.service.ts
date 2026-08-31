import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/types';

export const UserService = {
  /**
   * Retrieves a user by their ID.
   */
  async getUserById(id: string): Promise<User | null> {
    return UserRepository.findById(id);
  },

  /**
   * Retrieves a user by their email address.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return UserRepository.findByEmail(email);
  },
};
