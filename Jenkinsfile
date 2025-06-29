pipeline {
    agent any

    environment {
        TEX_DIR = 'C:\\Users\\RUDRANIL\\Desktop\\Resumes'
        GIT_LATEX_REPO = 'https://github.com/Zephyrus2822/resume-latex.git'
        GIT_PDF_REPO = 'https://github.com/Zephyrus2822/resume-pdf.git'
        GIT_CREDENTIALS_ID = 'github-creds'
    }

    parameters {
        string(name: 'user_id', defaultValue: 'Rudranil', description: 'User ID')
        string(name: 'role', defaultValue: 'Software Engineer', description: 'Role')
        choice(name: 'mode', choices: ['latex', 'pdf'], description: 'Choose resume format')
    }

    stages {
        stage('Clone Repo') {
            steps {
                script {
                    def repo = params.mode == 'latex' ? env.GIT_LATEX_REPO : env.GIT_PDF_REPO
                    git branch: 'main', url: repo, credentialsId: env.GIT_CREDENTIALS_ID
                }
            }
        }
        stage('Copy Resume File') {
            steps {
                script {
                    def safeRole = params.role.replaceAll('[\\\\/*?:"<>| ]', '_')
                    def ext = params.mode == 'latex' ? 'tex' : 'pdf'
                    def filename = "${params.user_id}_${safeRole}.${ext}"
                    def srcPath = "${env.TEX_DIR}\\${filename}"
                    def destPath = "${env.WORKSPACE}\\${filename}"
                    echo "🔄 Copying ${srcPath} to Jenkins workspace"
                    bat "dir \"${env.TEX_DIR}\""
                    bat "copy \"${srcPath}\" \"${destPath}\""
                }
            }
        }

        stage('Git Commit & Push') {
            steps {
                script {
                    def safeRole = params.role.replaceAll('[\\\\/*?:"<>| ]', '_')
                    def ext = params.mode == 'latex' ? 'tex' : 'pdf'
                    def filename = "${params.user_id}_${safeRole}.${ext}"
                    bat """
                    git config --global user.name "JenkinsBot"
                    git config --global user.email "jenkins@localhost"
                    git config --global --add safe.directory "C:/ProgramData/Jenkins/.jenkins/workspace/resume-latex-pipeline"
                    git add "${filename}"
                    git commit -m "Update resume: ${filename}" || echo Nothing to commit
                    echo 🔼 Pushing to GitHub...
                    git push -u origin main
                    echo ✅ Push complete!
                    exit /b 0
                """
                }
            }
        }
    }
}

