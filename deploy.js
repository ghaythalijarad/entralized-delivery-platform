#!/usr/bin/env node

/**
 * Node.js 22 Deployment Script for AWS Amplify
 * Replaces Python deployment scripts
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentManager {
    constructor() {
        this.projectName = 'centralized-platform';
        this.environment = process.env.NODE_ENV || 'development';
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

    async checkPrerequisites() {
        await this.log('Checking prerequisites...', 'progress');
        
        try {
            // Check Node.js version
            const { stdout: nodeVersion } = await execAsync('node --version');
            const version = nodeVersion.trim();
            await this.log(`Node.js version: ${version}`, 'info');
            
            if (!version.startsWith('v22')) {
                throw new Error(`Node.js 22 required, found ${version}`);
            }
            
            // Check AWS CLI
            try {
                const { stdout: awsVersion } = await execAsync('aws --version');
                await this.log(`AWS CLI: ${awsVersion.trim()}`, 'info');
            } catch (error) {
                throw new Error('AWS CLI not installed or not in PATH');
            }
            
            // Check Amplify CLI
            try {
                const { stdout: amplifyVersion } = await execAsync('amplify --version');
                await this.log(`Amplify CLI: ${amplifyVersion.trim()}`, 'info');
            } catch (error) {
                throw new Error('Amplify CLI not installed. Run: npm install -g @aws-amplify/cli');
            }
            
            await this.log('Prerequisites check passed', 'success');
        } catch (error) {
            await this.log(`Prerequisites check failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async installDependencies() {
        await this.log('Installing Node.js dependencies...', 'progress');
        
        try {
            const { stdout, stderr } = await execAsync('npm install', {
                cwd: __dirname,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            
            if (stderr && !stderr.includes('WARN')) {
                await this.log(`npm install warnings: ${stderr}`, 'warning');
            }
            
            await this.log('Dependencies installed successfully', 'success');
        } catch (error) {
            await this.log(`Failed to install dependencies: ${error.message}`, 'error');
            throw error;
        }
    }

    async checkAmplifyStatus() {
        await this.log('Checking Amplify project status...', 'progress');
        
        try {
            const { stdout } = await execAsync('amplify status', { cwd: __dirname });
            await this.log('Amplify status check completed', 'success');
            return stdout;
        } catch (error) {
            await this.log('Amplify project not initialized or error occurred', 'warning');
            return null;
        }
    }

    async initializeAmplify() {
        await this.log('Initializing Amplify project...', 'progress');
        
        try {
            // Check if amplify is already initialized
            const amplifyDir = path.join(__dirname, 'amplify');
            try {
                await fs.access(amplifyDir);
                await this.log('Amplify already initialized, skipping init', 'info');
                return;
            } catch {
                // Directory doesn't exist, proceed with init
            }
            
            // Initialize Amplify with default settings
            const initCommand = [
                'amplify', 'init',
                '--yes',
                '--amplify', JSON.stringify({
                    projectName: this.projectName,
                    envName: this.environment,
                    defaultEditor: 'code'
                }),
                '--providers', JSON.stringify({
                    awscloudformation: {
                        configLevel: 'project',
                        useProfile: true,
                        profileName: 'default'
                    }
                }),
                '--frontend', JSON.stringify({
                    frontend: 'javascript',
                    framework: 'none',
                    config: {
                        SourceDir: 'src',
                        DistributionDir: 'dist',
                        BuildCommand: 'npm run build',
                        StartCommand: 'npm start'
                    }
                })
            ];
            
            await this.executeCommand('amplify', initCommand.slice(1));
            await this.log('Amplify project initialized', 'success');
        } catch (error) {
            await this.log(`Failed to initialize Amplify: ${error.message}`, 'error');
            throw error;
        }
    }

    async addAuthentication() {
        await this.log('Adding Amplify Authentication...', 'progress');
        
        try {
            const authConfig = {
                serviceType: 'cognito',
                serviceName: 'cognito',
                userPoolName: `${this.projectName}_userpool`,
                autoVerifiedAttributes: ['email'],
                mfaConfiguration: 'OPTIONAL',
                mfaTypes: ['SMS'],
                passwordPolicy: {
                    minimumLength: 8,
                    requireNumbers: true,
                    requireLowercase: true,
                    requireUppercase: true,
                    requireSymbols: true
                },
                signupAttributes: ['email'],
                socialProviders: [],
                usernameAttributes: ['email'],
                verificationBucketName: `${this.projectName}verification`
            };
            
            await this.executeCommand('amplify', [
                'add', 'auth',
                '--yes',
                '--authSelections', 'identityPoolAndUserPool',
                '--userPoolName', authConfig.userPoolName,
                '--usernameAttributes', 'email',
                '--passwordPolicyMinLength', '8',
                '--passwordPolicyCharacters', 'Requires at least 8 characters'
            ]);
            
            await this.log('Authentication added successfully', 'success');
        } catch (error) {
            await this.log(`Failed to add authentication: ${error.message}`, 'error');
            throw error;
        }
    }

    async addAPI() {
        await this.log('Adding Amplify API...', 'progress');
        
        try {
            await this.executeCommand('amplify', [
                'add', 'api',
                '--yes',
                '--apiType', 'graphql',
                '--apiName', `${this.projectName}api`,
                '--defaultAuthType', 'cognito',
                '--conflict', 'automerge'
            ]);
            
            await this.log('API added successfully', 'success');
        } catch (error) {
            await this.log(`Failed to add API: ${error.message}`, 'error');
            throw error;
        }
    }

    async addHosting() {
        await this.log('Adding Amplify Hosting...', 'progress');
        
        try {
            await this.executeCommand('amplify', [
                'add', 'hosting',
                '--type', 'cicd',
                '--yes'
            ]);
            
            await this.log('Hosting added successfully', 'success');
        } catch (error) {
            await this.log(`Failed to add hosting: ${error.message}`, 'error');
            throw error;
        }
    }

    async buildProject() {
        await this.log('Building project...', 'progress');
        
        try {
            await execAsync('npm run build', { cwd: __dirname });
            await this.log('Project built successfully', 'success');
        } catch (error) {
            await this.log(`Build failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployToAmplify() {
        await this.log('Deploying to AWS Amplify...', 'progress');
        
        try {
            await this.executeCommand('amplify', ['push', '--yes']);
            await this.log('Deployment completed successfully', 'success');
        } catch (error) {
            await this.log(`Deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async publishApp() {
        await this.log('Publishing application...', 'progress');
        
        try {
            const { stdout } = await execAsync('amplify publish --yes', { cwd: __dirname });
            
            // Extract URL from output
            const urlMatch = stdout.match(/https:\/\/[^\s]+/);
            if (urlMatch) {
                await this.log(`Application published successfully: ${urlMatch[0]}`, 'success');
                return urlMatch[0];
            }
            
            await this.log('Application published successfully', 'success');
            return null;
        } catch (error) {
            await this.log(`Publishing failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async executeCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, {
                cwd: __dirname,
                stdio: 'inherit'
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });
            
            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    async fullDeploy() {
        try {
            await this.log('🚀 Starting full deployment process...', 'progress');
            
            await this.checkPrerequisites();
            await this.installDependencies();
            
            const amplifyStatus = await this.checkAmplifyStatus();
            if (!amplifyStatus) {
                await this.initializeAmplify();
                await this.addAuthentication();
                await this.addAPI();
                await this.addHosting();
            }
            
            await this.buildProject();
            await this.deployToAmplify();
            const appUrl = await this.publishApp();
            
            await this.log('🎉 Deployment completed successfully!', 'success');
            if (appUrl) {
                await this.log(`🌐 Your app is live at: ${appUrl}`, 'success');
            }
            
        } catch (error) {
            await this.log(`❌ Deployment failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const deployment = new DeploymentManager();
    const command = process.argv[2] || 'deploy';
    
    switch (command) {
        case 'deploy':
        case 'full':
            deployment.fullDeploy();
            break;
        case 'check':
            deployment.checkPrerequisites();
            break;
        case 'install':
            deployment.installDependencies();
            break;
        case 'init':
            deployment.initializeAmplify();
            break;
        case 'build':
            deployment.buildProject();
            break;
        case 'publish':
            deployment.publishApp();
            break;
        default:
            console.log('Usage: node deploy.js [command]');
            console.log('Commands: deploy, check, install, init, build, publish');
    }
}

export default DeploymentManager;
