pipeline {
    agent any

    environment {
        TEX_DIR = 'C:/Users/RUDRANIL/Desktop/Resumes'
        GIT_LATEX_REPO = 'https://github.com/Zephyrus2822/resume-latex.git'
        GIT_PDF_REPO = 'https://github.com/Zephyrus2822/resume-pdf.git'
        GIT_CREDENTIALS_ID = 'github-creds'
    }

    parameters {
        string(name: 'user_id', defaultValue: 'Rudranil', description: 'User ID')
        string(name: 'role', defaultValue: 'Software Engineer', description: 'User Role')
        choice(name: 'mode', choices: ['latex', 'pdf'], description: 'Push format of resume')
    }

    stages {
        stage('Checkout Repository') {
            steps {
                script {
                    def repo = params.mode == 'latex' ? env.GIT_LATEX_REPO : env.GIT_PDF_REPO
                    git credentialsId: env.GIT_CREDENTIALS_ID, url: repo
                }
            }
        }

        stage('Copy Resume File') {
            steps {
                script {
                    def safeRole = params.role.replaceAll(' ', '-')
                    def ext = params.mode == 'latex' ? 'tex' : 'pdf'
                    def filename = "${params.user_id}_${safeRole}.${ext}"
                    def srcPath = "${env.TEX_DIR}\\${filename}"
                    def destPath = "${env.WORKSPACE}\\${filename}"

                    echo "📁 Copying: ${srcPath} → ${destPath}"
                    bat "copy \"${srcPath}\" \"${destPath}\" /Y"

                    echo '🧾 Directory Listing:'
                    bat "dir \"${env.WORKSPACE}\""
                }
            }
        }

        stage('Commit and Push Changes') {
            steps {
                script {
                    def safeRole = params.role.replaceAll(' ', '-')
                    def ext = params.mode == 'latex' ? 'tex' : 'pdf'
                    def filename = "${params.user_id}_${safeRole}.${ext}"

                    bat """
                        git config user.name "JenkinsBot"
                        git config user.email "jenkins@localhost"

                        echo 🔄 Adding ${filename}
                        git add "${filename}"

                        echo 💬 Committing...
                        git commit -m "🔁 Updated resume: ${filename}" || echo ⚠️ Nothing to commit

                        echo 🚀 Pushing...
                        git push origin main
                    """
                }
            }
        }
    }
}
