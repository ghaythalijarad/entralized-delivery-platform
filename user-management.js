#!/usr/bin/env node

/**
 * Node.js 22 User Management Script
 * Replaces Python user management with AWS Cognito
 */

import { CognitoIdentityProviderClient, 
         AdminCreateUserCommand, 
         AdminSetUserPasswordCommand,
         AdminAddUserToGroupCommand,
         AdminListUsersCommand,
         AdminGetUserCommand,
         AdminDeleteUserCommand,
         CreateGroupCommand,
         ListGroupsCommand } from '@aws-sdk/client-cognito-identity-provider';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

class UserManager {
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.userPoolId = process.env.USER_POOL_ID || null;
        
        this.cognitoClient = new CognitoIdentityProviderClient({
            region: this.region,
            credentials: fromNodeProviderChain()
        });
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📄',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            progress: '🔄'
        }[type] || '📄';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async createAdminUser(email, password, firstName = '', lastName = '') {
        if (!this.userPoolId) {
            throw new Error('USER_POOL_ID environment variable not set');
        }

        try {
            await this.log(`Creating admin user: ${email}`, 'progress');

            // Create user
            const createUserCommand = new AdminCreateUserCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email
                    },
                    {
                        Name: 'email_verified',
                        Value: 'true'
                    },
                    {
                        Name: 'given_name',
                        Value: firstName
                    },
                    {
                        Name: 'family_name',
                        Value: lastName
                    },
                    {
                        Name: 'custom:user_type',
                        Value: 'admin'
                    }
                ],
                TemporaryPassword: password,
                MessageAction: 'SUPPRESS' // Don't send welcome email
            });

            const createResult = await this.cognitoClient.send(createUserCommand);
            await this.log(`User created successfully: ${email}`, 'success');

            // Set permanent password
            const setPasswordCommand = new AdminSetUserPasswordCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                Password: password,
                Permanent: true
            });

            await this.cognitoClient.send(setPasswordCommand);
            await this.log('Password set as permanent', 'success');

            // Add to admin group
            try {
                const addToGroupCommand = new AdminAddUserToGroupCommand({
                    UserPoolId: this.userPoolId,
                    Username: email,
                    GroupName: 'admin'
                });

                await this.cognitoClient.send(addToGroupCommand);
                await this.log('User added to admin group', 'success');
            } catch (groupError) {
                await this.log('Admin group might not exist, creating it...', 'warning');
                await this.createGroup('admin', 'Administrators with full access');
                
                // Retry adding to group
                const addToGroupCommand = new AdminAddUserToGroupCommand({
                    UserPoolId: this.userPoolId,
                    Username: email,
                    GroupName: 'admin'
                });
                await this.cognitoClient.send(addToGroupCommand);
                await this.log('User added to admin group', 'success');
            }

            return {
                success: true,
                user: createResult.User,
                message: `Admin user ${email} created successfully`
            };

        } catch (error) {
            await this.log(`Failed to create admin user: ${error.message}`, 'error');
            throw error;
        }
    }

    async createGroup(groupName, description) {
        try {
            const createGroupCommand = new CreateGroupCommand({
                UserPoolId: this.userPoolId,
                GroupName: groupName,
                Description: description,
                Precedence: groupName === 'admin' ? 1 : 
                           groupName === 'manager' ? 2 : 
                           groupName === 'operator' ? 3 : 4
            });

            await this.cognitoClient.send(createGroupCommand);
            await this.log(`Group '${groupName}' created successfully`, 'success');
        } catch (error) {
            if (error.name === 'GroupExistsException') {
                await this.log(`Group '${groupName}' already exists`, 'info');
            } else {
                throw error;
            }
        }
    }

    async listUsers(limit = 60) {
        if (!this.userPoolId) {
            throw new Error('USER_POOL_ID environment variable not set');
        }

        try {
            const listUsersCommand = new AdminListUsersCommand({
                UserPoolId: this.userPoolId,
                Limit: limit
            });

            const result = await this.cognitoClient.send(listUsersCommand);
            
            const users = result.Users.map(user => ({
                username: user.Username,
                email: user.Attributes?.find(attr => attr.Name === 'email')?.Value,
                firstName: user.Attributes?.find(attr => attr.Name === 'given_name')?.Value,
                lastName: user.Attributes?.find(attr => attr.Name === 'family_name')?.Value,
                userType: user.Attributes?.find(attr => attr.Name === 'custom:user_type')?.Value,
                status: user.UserStatus,
                created: user.UserCreateDate,
                lastModified: user.UserLastModifiedDate
            }));

            await this.log(`Found ${users.length} users`, 'info');
            return users;

        } catch (error) {
            await this.log(`Failed to list users: ${error.message}`, 'error');
            throw error;
        }
    }

    async deleteUser(username) {
        if (!this.userPoolId) {
            throw new Error('USER_POOL_ID environment variable not set');
        }

        try {
            const deleteUserCommand = new AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: username
            });

            await this.cognitoClient.send(deleteUserCommand);
            await this.log(`User ${username} deleted successfully`, 'success');
            return { success: true, message: `User ${username} deleted` };

        } catch (error) {
            await this.log(`Failed to delete user: ${error.message}`, 'error');
            throw error;
        }
    }

    async setupDefaultGroups() {
        const groups = [
            { name: 'admin', description: 'Administrators with full system access' },
            { name: 'manager', description: 'Managers with operational access' },
            { name: 'operator', description: 'Operators with limited access' },
            { name: 'viewer', description: 'View-only access' }
        ];

        await this.log('Setting up default user groups...', 'progress');

        for (const group of groups) {
            await this.createGroup(group.name, group.description);
        }

        await this.log('Default groups setup completed', 'success');
    }

    async getUserPoolInfo() {
        if (!this.userPoolId) {
            await this.log('USER_POOL_ID not configured', 'warning');
            return null;
        }

        try {
            const users = await this.listUsers(5);
            const listGroupsCommand = new ListGroupsCommand({
                UserPoolId: this.userPoolId
            });
            const groupsResult = await this.cognitoClient.send(listGroupsCommand);

            return {
                userPoolId: this.userPoolId,
                region: this.region,
                totalUsers: users.length,
                groups: groupsResult.Groups?.map(g => g.GroupName) || []
            };
        } catch (error) {
            await this.log(`Failed to get user pool info: ${error.message}`, 'error');
            return null;
        }
    }
}

// CLI interface
async function main() {
    const userManager = new UserManager();
    const command = process.argv[2];
    
    try {
        switch (command) {
            case 'create-admin':
                const email = process.argv[3];
                const password = process.argv[4];
                const firstName = process.argv[5] || '';
                const lastName = process.argv[6] || '';
                
                if (!email || !password) {
                    console.log('Usage: node user-management.js create-admin <email> <password> [firstName] [lastName]');
                    process.exit(1);
                }
                
                await userManager.createAdminUser(email, password, firstName, lastName);
                break;
                
            case 'list':
                const users = await userManager.listUsers();
                console.table(users);
                break;
                
            case 'delete':
                const username = process.argv[3];
                if (!username) {
                    console.log('Usage: node user-management.js delete <username>');
                    process.exit(1);
                }
                await userManager.deleteUser(username);
                break;
                
            case 'setup-groups':
                await userManager.setupDefaultGroups();
                break;
                
            case 'info':
                const info = await userManager.getUserPoolInfo();
                if (info) {
                    console.log('\n📊 User Pool Information:');
                    console.log(`   Pool ID: ${info.userPoolId}`);
                    console.log(`   Region: ${info.region}`);
                    console.log(`   Users: ${info.totalUsers}`);
                    console.log(`   Groups: ${info.groups.join(', ')}`);
                }
                break;
                
            default:
                console.log('Node.js 22 User Management for AWS Cognito\n');
                console.log('Usage: node user-management.js <command> [options]\n');
                console.log('Commands:');
                console.log('  create-admin <email> <password> [firstName] [lastName]  Create admin user');
                console.log('  list                                                   List all users');
                console.log('  delete <username>                                      Delete user');
                console.log('  setup-groups                                           Create default groups');
                console.log('  info                                                   Show user pool info');
                console.log('\nEnvironment Variables:');
                console.log('  USER_POOL_ID - AWS Cognito User Pool ID');
                console.log('  AWS_REGION   - AWS Region (default: us-east-1)');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default UserManager;
